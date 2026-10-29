# Room-Tracking Smart Home

A local smart home system for room-accurate smartphone localization using ESP32 nodes (BLE), a Nuxt 4 / Vue 3 web application, and direct integration with Home Assistant (including "light follows me" logic, hallway path lighting, and microphone double-clap detection).

## Technology Stack

* **Frontend:** Nuxt 4 (Vue 3 SPA, Mobile-first, Dark Mode, Touch-optimized)
* **Backend:** Nitro Server Engine (API and processing engine)
* **Hardware:** ESP32 (Arduino / C++) with BLE (iBeacon) & I2S Microphone
* **Smart Home:** Home Assistant REST API

## 1. System Overview

The system tracks your smartphone using Signal Strength (RSSI) received by distributed ESP32 nodes throughout your home. As soon as you enter a room, Home Assistant automatically switches on the lights ("light follows me") and turns them off after a brief delay when you leave. Additionally, lights can be manually toggled via a double-clap detected by microphones on the ESP32 nodes.

## 2. Key Features

* **"Light Follows Me":** Automatically turns on lights upon entering a room and turns them off after a configurable delay when leaving.
* **Hallway Path Lighting:** Optional automation that temporarily switches on the hallway light when moving between rooms.
* **Double-Clap Detection:** Manual control of room lighting using a microphone connected to the ESP32 (or tested via the UI).
* **Signal Calibration & RSSI Filtering:** Offsets structural dampening (walls/furniture) per room using manual offsets (+/- dB) and one-click auto-calibration.
* **Automation & Webhooks:** Dedicated start and stop URLs for Apple Shortcuts, Android routines, or HTTP shortcuts.
* **Live Room Management (`/rooms`):** Visual management interface for rooms and Home Assistant entities (persisted directly to `rooms.json` without requiring a server restart).
* **Activity Feed:** Live log displaying recent system events.

## 3. Architecture & Components

### A. Frontend (Nuxt 4 / Vue 3 SPA)

Mobile-first web app with Dark Mode, optimized for touchscreens and status overviews:

* **Dashboard (`/`):**
  * **Hero Radar Controller:** Large touch button to start/stop tracking, displaying current location and signal strength.
  * **Settings:** Device name, "Light follows me" toggle, MAC address input (with helper tooltips), and display Screen Wake Lock.
  * **Path Lighting:** Optional automation for hallway transitions.
  * **Signal Calibration:** Adjustment for room signal dampening.
  * **Automation / Webhooks:** Trigger URLs for external control.
  * **Homescreen & Widgets:** Instructions and URLs for HTTP Shortcuts / Apple Shortcuts, including context on HTTP PWA limitations.
  * **Rooms & Lighting:** Overview of all configured rooms, live signal strength indicators, manual switches, and direct link to room management.
  * **Quick Actions:** Clap test simulation and manual refresh.
  * **Activity Feed:** Live event logger.

* **Room Configuration (`/rooms`):**
  * Visual editor for managing rooms and Home Assistant entity assignments.
  * Add, rename, or delete rooms with instant saving to `rooms.json`.

### B. Backend (Nitro Server Engine)

* **Follow Engine (`server/utils/followEngine.ts`):**
  Evaluates incoming signal strengths, filters noise and hysteresis, determines room presence, and manages state transition timers.

* **Home Assistant Integration (`server/utils/haService.ts`):**
  Automatically detects whether an entity is a `switch.*` or `light.*` device and triggers the appropriate HA service (`turn_on`, `turn_off`, `toggle`).

* **Core API Routes:**
  * `POST /api/presence` – Heartbeat and signal data transmission from the smartphone.
  * `POST /api/rssi` – Signal reports from ESP32 nodes.
  * `POST /api/track` – Clap event reports from ESP32 microphones.
  * `GET/POST /api/action/simulate-clap` – Simulated clap test trigger.
  * `GET/POST /api/action/start` & `GET/POST /api/action/stop` – Webhook triggers for external automations.
  * `GET/POST /api/rooms` – Room entity mapping management.
  * `GET/POST /api/calibration` & `GET/POST /api/settings` – Calibration and hallway lighting preferences.

### C. Hardware (ESP32 Node / `room_node.ino`)

* Runs on ESP32 equipped with an I2S microphone and Bluetooth LE.
* **iBeacon:** Broadcasts BLE packets allowing the smartphone to measure proximity to each node.
* **Double-Clap Detection:** Listens for two defined audio peak thresholds within a set time window to transmit a toggle command to the server.
* **Configuration:** Requires only `ROOM_ID` (e.g., `living_room`) and the server IP address defined in the sketch code.

## 4. Configuration

### `.env` — Home Assistant Credentials

Create a `.env` file in the project root directory with your credentials:

```env
HA_URL=http://ha.lan:8123
HA_TOKEN=your_long_lived_access_token_here
HA_ENTITY_ID=switch.shelly1mini_6055f99b5fdc_switch_0
HA_SERVICE=switch/toggle
```

### `rooms.json` — Room & Entity Mappings

Links room IDs to Home Assistant entity IDs. Can be configured directly via the file or through the web interface at `/rooms`.

## 5. Build & Deployment

### Building after code changes:

```powershell
cd "c:\Users\timor\Downloads\Neuer Ordner (3)"
npx nuxi build
```

### Starting the server:

```powershell
cd "c:\Users\timor\Downloads\Neuer Ordner (3)"
node .output/server/index.mjs
```

### Web Access:

* **Dashboard:** `http://<SERVER-IP>:3000/`
* **Room Management:** `http://<SERVER-IP>:3000/rooms`

## 6. Project Structure Overview

* `server/utils/followEngine.ts` – Core signal processing and presence state machine
* `server/utils/haService.ts` – Home Assistant REST API client
* `rooms.json` – Room to Home Assistant entity associations
* `.env` – System environment variables and API tokens