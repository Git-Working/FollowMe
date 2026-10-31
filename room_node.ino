#include <WiFi.h>
#include <HTTPClient.h>
#include <ESP_I2S.h>
#include <esp_wifi.h>

// BLE Beacon Libraries for ESP32
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <BLEBeacon.h>
#include <BLEAdvertising.h>

// ==========================================
// Konfiguration
// ==========================================
const char* WIFI_SSID = "YOUR_SSID";
const char* WIFI_PASSWORD = "YOUR_PASSWORD";
const char* SERVER_BASE = "http://192.168.1.10:3000";
const char* ROOM_ID = "wohnzimmer";

// 3.2: BLE Beacon Modus (ESP32 sendet Beacons an Mobilgeräte)
const bool ENABLE_BLE_BEACON = true;
#define BEACON_UUID "742cfc8a-9fa6-479c-8603-6c60314b2882"

// 3.1: Doppel-Klatsch-Erkennung (Standard: true)
const bool ENABLE_MIC = true;
const bool REQUIRE_DOUBLE_CLAP = true;
const uint32_t DOUBLE_CLAP_MIN_GAP_MS = 150;  // Mindestabstand (filtert Hall / Nachhall)
const uint32_t DOUBLE_CLAP_MAX_GAP_MS = 1100; // Maximales Zeitfenster zwischen 2 Klatschen (1.1s)
const uint32_t COOLDOWN_MS = 1200;            // Sperrzeit nach erfolgreicher Auslösung

// I2S Mikrofon-Pins (z.B. INMP441)
const int PIN_SCK = 2;
const int PIN_WS = 3;
const int PIN_SD = 4;

const uint32_t SAMPLE_RATE = 16000;
const size_t BLOCK_SAMPLES = 256;
const float CLAP_RATIO = 4.5f;                // Impuls-Verhältnis zur Hintergrundlautstärke
const int32_t MIN_CLAP_LEVEL = 250000;        // Empfindlicherer Schwellenwert (Spitzenwert)

// Wi-Fi Polling & Reporting
const uint32_t POLL_INTERVAL_MS = 5000;
const uint32_t REPORT_INTERVAL_MS = 2000;
const size_t MAX_WATCH = 4;

struct Watch {
  uint8_t mac[6];
  int32_t rssiSum;
  uint32_t frames;
};

Watch watchList[MAX_WATCH];
size_t watchCount = 0;
portMUX_TYPE watchMux = portMUX_INITIALIZER_UNLOCKED;

I2SClass i2s;
int32_t samples[BLOCK_SAMPLES];
float baseline = 0;
uint32_t lastClapMs = 0;
uint32_t firstClapMs = 0;
bool waitingForSecondClap = false;

uint32_t lastPollMs = 0;
uint32_t lastReportMs = 0;
bool micRunning = false;
bool sniffing = false;

BLEAdvertising* pAdvertising = nullptr;

// ==========================================
// BLE Beacon Setup (3.2)
// ==========================================
uint16_t getRoomMajor(const char* room) {
  uint16_t hash = 5381;
  while (*room) {
    hash = ((hash << 5) + hash) + (uint8_t)(*room++);
  }
  return hash;
}

void startBleBeacon() {
  if (!ENABLE_BLE_BEACON) return;
  Serial.println("Initialisiere BLE Beacon...");
  BLEDevice::init(String("RT-") + ROOM_ID);
  pAdvertising = BLEDevice::getAdvertising();

  BLEBeacon beacon;
  beacon.setManufacturerId(0x4C00); // Standard Apple iBeacon Format
  BLEUUID uuid(BEACON_UUID);
  beacon.setProximityUUID(uuid);
  beacon.setMajor(getRoomMajor(ROOM_ID));
  beacon.setMinor(1);
  beacon.setSignalPower(-59); // Referenzsignalpegel bei 1m

  BLEAdvertisementData advData;
  advData.setFlags(0x04); // BR_EDR_NOT_SUPPORTED
  advData.setManufacturerData(beacon.getData());

  BLEAdvertisementData scanResponseData;
  scanResponseData.setName(String("RT-") + ROOM_ID);

  pAdvertising->setAdvertisementData(advData);
  pAdvertising->setScanResponseData(scanResponseData);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinInterval(160); // 100 ms Intervall (160 * 0.625ms)
  pAdvertising->setMaxInterval(320); // 200 ms Intervall

  pAdvertising->start();
  Serial.printf("BLE Beacon aktiv: Raum='%s' (Major: %u, UUID: %s)\n",
                ROOM_ID, getRoomMajor(ROOM_ID), BEACON_UUID);
}

// ==========================================
// Wi-Fi Verbindung
// ==========================================
void connectWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print('.');
  }
  Serial.printf("\nConnected, IP: %s\n", WiFi.localIP().toString().c_str());
}

bool parseMac(const String& text, uint8_t out[6]) {
  unsigned v[6];
  if (sscanf(text.c_str(), "%x:%x:%x:%x:%x:%x", &v[0], &v[1], &v[2], &v[3], &v[4], &v[5]) != 6) {
    return false;
  }
  for (int i = 0; i < 6; i++) out[i] = (uint8_t)v[i];
  return true;
}

// ==========================================
// Wi-Fi Sniffing (Promiscuous Mode)
// ==========================================
void onFrame(void* buf, wifi_promiscuous_pkt_type_t type) {
  const wifi_promiscuous_pkt_t* pkt = (const wifi_promiscuous_pkt_t*)buf;
  if (pkt->rx_ctrl.sig_len < 16) return;
  const uint8_t* sender = pkt->payload + 10;

  portENTER_CRITICAL(&watchMux);
  for (size_t i = 0; i < watchCount; i++) {
    if (memcmp(sender, watchList[i].mac, 6) == 0) {
      watchList[i].rssiSum += pkt->rx_ctrl.rssi;
      watchList[i].frames++;
      break;
    }
  }
  portEXIT_CRITICAL(&watchMux);
}

void startSniffing() {
  wifi_promiscuous_filter_t filter;
  filter.filter_mask = WIFI_PROMIS_FILTER_MASK_DATA;
  esp_wifi_set_promiscuous_filter(&filter);
  esp_wifi_set_promiscuous_rx_cb(&onFrame);
  esp_wifi_set_promiscuous(true);
  sniffing = true;
  Serial.println("Wi-Fi Sniffing aktiv");
}

void stopSniffing() {
  esp_wifi_set_promiscuous(false);
  sniffing = false;
  Serial.println("Wi-Fi Sniffing aus");
}

void setWatchList(uint8_t macs[][6], size_t count) {
  portENTER_CRITICAL(&watchMux);
  watchCount = count;
  for (size_t i = 0; i < count; i++) {
    memcpy(watchList[i].mac, macs[i], 6);
    watchList[i].rssiSum = 0;
    watchList[i].frames = 0;
  }
  portEXIT_CRITICAL(&watchMux);
}

// ==========================================
// I2S Mikrofon Steuerung
// ==========================================
void startMic() {
  i2s.setPins(PIN_SCK, PIN_WS, -1, PIN_SD);
  if (!i2s.begin(I2S_MODE_STD, SAMPLE_RATE, I2S_DATA_BIT_WIDTH_32BIT,
                 I2S_SLOT_MODE_MONO, I2S_STD_SLOT_LEFT)) {
    Serial.println("I2S init failed");
    return;
  }
  baseline = 0;
  waitingForSecondClap = false;
  micRunning = true;
  Serial.println("Mikrofon aktiv");
}

void stopMic() {
  i2s.end();
  micRunning = false;
  waitingForSecondClap = false;
  Serial.println("Mikrofon aus");
}

// ==========================================
// Server Kommunikation
// ==========================================
void pollServer() {
  if (WiFi.status() != WL_CONNECTED) connectWifi();

  bool tracking = false;
  uint8_t macs[MAX_WATCH][6];
  size_t macCount = 0;

  HTTPClient http;
  http.begin(String(SERVER_BASE) + "/api/node");
  if (http.GET() == 200) {
    String body = http.getString();
    int start = 0;
    while (start < (int)body.length()) {
      int end = body.indexOf('\n', start);
      if (end < 0) end = body.length();
      String line = body.substring(start, end);
      line.trim();
      if (line == "tracking=1") tracking = true;
      if (line.startsWith("mac=") && macCount < MAX_WATCH) {
        if (parseMac(line.substring(4), macs[macCount])) macCount++;
      }
      start = end + 1;
    }
  }
  http.end();

  if (ENABLE_MIC) {
    if (tracking && !micRunning) startMic();
    if (!tracking && micRunning) stopMic();
  }

  if (tracking && macCount > 0) {
    setWatchList(macs, macCount);
    if (!sniffing) startSniffing();
  } else {
    if (sniffing) stopSniffing();
    setWatchList(macs, 0);
  }
}

void reportRssi() {
  int32_t avg[MAX_WATCH];
  bool has[MAX_WATCH];
  uint8_t macs[MAX_WATCH][6];
  size_t count;

  portENTER_CRITICAL(&watchMux);
  count = watchCount;
  for (size_t i = 0; i < count; i++) {
    memcpy(macs[i], watchList[i].mac, 6);
    has[i] = watchList[i].frames > 0;
    avg[i] = has[i] ? watchList[i].rssiSum / (int32_t)watchList[i].frames : 0;
    watchList[i].rssiSum = 0;
    watchList[i].frames = 0;
  }
  portEXIT_CRITICAL(&watchMux);

  String readings;
  for (size_t i = 0; i < count; i++) {
    if (!has[i]) continue;
    char mac[18];
    snprintf(mac, sizeof(mac), "%02x:%02x:%02x:%02x:%02x:%02x",
             macs[i][0], macs[i][1], macs[i][2], macs[i][3], macs[i][4], macs[i][5]);
    if (readings.length() > 0) readings += ",";
    readings += String("{\"mac\":\"") + mac + "\",\"rssi\":" + avg[i] + "}";
  }
  if (readings.length() == 0) return;

  HTTPClient http;
  http.begin(String(SERVER_BASE) + "/api/rssi");
  http.addHeader("Content-Type", "application/json");
  http.POST(String("{\"room\":\"") + ROOM_ID + "\",\"readings\":[" + readings + "]}");
  http.end();
}

void sendClap(int32_t level, bool isDouble = true) {
  HTTPClient http;
  http.begin(String(SERVER_BASE) + "/track");
  http.addHeader("Content-Type", "application/json");
  String body = String("{\"event\":\"clap\",\"room\":\"") + ROOM_ID +
                "\",\"level\":" + level +
                ",\"double\":" + (isDouble ? "true" : "false") + "}";
  int code = http.POST(body);
  Serial.printf("POST /track -> %d (Doppelklatsch: %s)\n", code, isDouble ? "ja" : "nein");
  http.end();
}

// 3.1: Doppel-Klatsch Auswertung
void handleMic(uint32_t now) {
  size_t bytes = i2s.readBytes((char*)samples, sizeof(samples));
  size_t count = bytes / sizeof(int32_t);
  if (count == 0) return;

  int64_t sum = 0;
  for (size_t i = 0; i < count; i++) {
    int32_t s = samples[i] >> 8;
    sum += s < 0 ? -s : s;
  }
  int32_t level = (int32_t)(sum / (int64_t)count);

  // Zeitfenster für zweiten Klatsch abgelaufen?
  if (waitingForSecondClap && (now - firstClapMs > DOUBLE_CLAP_MAX_GAP_MS)) {
    waitingForSecondClap = false;
    Serial.println("2. Klatsch: Zeitfenster abgelaufen");
  }

  bool cooledDown = (now - lastClapMs > COOLDOWN_MS);
  bool isSpike = (level > MIN_CLAP_LEVEL && level > baseline * CLAP_RATIO);

  if (cooledDown && isSpike) {
    if (REQUIRE_DOUBLE_CLAP) {
      if (!waitingForSecondClap) {
        // Erster Klatsch
        firstClapMs = now;
        waitingForSecondClap = true;
        Serial.printf("1. Klatsch erkannt (Level: %d). Warte auf 2. Klatsch...\n", level);
      } else {
        // Zweiter Klatsch
        uint32_t gap = now - firstClapMs;
        if (gap >= DOUBLE_CLAP_MIN_GAP_MS && gap <= DOUBLE_CLAP_MAX_GAP_MS) {
          lastClapMs = now;
          waitingForSecondClap = false;
          Serial.printf("2. Klatsch erkannt! (Abstand: %u ms) -> Doppelklatsch aktiv!\n", gap);
          sendClap(level, true);
        }
      }
    } else {
      // Einzelklatsch
      lastClapMs = now;
      Serial.printf("Klatsch erkannt (Level: %d)\n", level);
      sendClap(level, false);
    }
  } else {
    baseline = baseline * 0.98f + level * 0.02f;
  }
}

// ==========================================
// Setup & Hauptschleife
// ==========================================
void setup() {
  Serial.begin(115200);
  connectWifi();
  startBleBeacon();
}

void loop() {
  uint32_t now = millis();

  if (lastPollMs == 0 || now - lastPollMs >= POLL_INTERVAL_MS) {
    lastPollMs = now;
    pollServer();
  }

  if (sniffing && now - lastReportMs >= REPORT_INTERVAL_MS) {
    lastReportMs = now;
    reportRssi();
  }

  if (micRunning) {
    handleMic(now);
  } else {
    delay(50);
  }
}
