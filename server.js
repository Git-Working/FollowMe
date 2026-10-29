if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch (_) {
    // .env is optional or already loaded by environment
  }
}

const express = require('express');
const fs = require('fs');
const path = require('path');
const { normalizeMac, createFollowEngine } = require('./follow');

const PORT = process.env.PORT || 3000;
const HA_URL = process.env.HA_URL;
const HA_TOKEN = process.env.HA_TOKEN;
const HA_ENTITY_ID = process.env.HA_ENTITY_ID;
const HA_SERVICE = process.env.HA_SERVICE || 'light/toggle';
const PRESENCE_TIMEOUT_MS = Number(process.env.PRESENCE_TIMEOUT_MS || 30000);
const ROOMS_FILE = process.env.ROOMS_FILE || path.join(__dirname, 'rooms.json');
const CALIBRATION_FILE = path.join(__dirname, 'calibration.json');
const SETTINGS_FILE = path.join(__dirname, 'settings.json');

function loadRooms() {
  try {
    return new Map(Object.entries(JSON.parse(fs.readFileSync(ROOMS_FILE, 'utf8'))));
  } catch (err) {
    console.warn(`No rooms loaded from ${ROOMS_FILE}: ${err.message}`);
    return new Map();
  }
}

function loadCalibration() {
  try {
    if (fs.existsSync(CALIBRATION_FILE)) {
      return JSON.parse(fs.readFileSync(CALIBRATION_FILE, 'utf8')) || {};
    }
  } catch (e) {
    console.warn(`Could not load calibration: ${e.message}`);
  }
  return {};
}

function saveCalibration(data) {
  try {
    fs.writeFileSync(CALIBRATION_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error(`Could not save calibration: ${e.message}`);
  }
}

function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')) || {};
    }
  } catch (e) {
    console.warn(`Could not load settings: ${e.message}`);
  }
  return {
    pathLighting: {
      enabled: false,
      hallwayRoom: '',
      durationSec: 30,
    },
  };
}

function saveSettings(data) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error(`Could not save settings: ${e.message}`);
  }
}

const rooms = loadRooms();
const activeUsers = new Map();
const app = express();

// Circular activity log for live mobile dashboard
const activityLog = [];
function logActivity(type, message, details = null) {
  const item = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    type, // 'system' | 'presence' | 'light' | 'clap' | 'error' | 'webhook'
    message,
    details,
  };
  activityLog.unshift(item);
  if (activityLog.length > 40) activityLog.pop();
  console.log(`[${item.time}] [${type}] ${message}`);
}

logActivity('system', `Server gestartet mit ${rooms.size} konfigurierten Räumen`);

// Accept both application/json and text/plain (used by navigator.sendBeacon on iOS)
app.use(express.json({ type: ['application/json', 'text/plain'] }));

function pruneUsers() {
  const now = Date.now();
  for (const [id, user] of activeUsers) {
    if (now - user.lastSeen > PRESENCE_TIMEOUT_MS) {
      activeUsers.delete(id);
      logActivity('presence', `Nutzer abgemeldet (Timeout): ${user.name}`);
    }
  }
}

function isTrackingActive() {
  pruneUsers();
  return activeUsers.size > 0;
}

async function callHomeAssistant(service, entityId) {
  if (!HA_URL || !HA_TOKEN || !entityId) {
    console.warn('Home Assistant not configured or missing entityId');
    return { ok: false, reason: 'unconfigured' };
  }
  const cleanUrl = `${HA_URL.replace(/\/$/, '')}/api/services/${service}`;
  const res = await fetch(cleanUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HA_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ entity_id: entityId }),
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`Home Assistant HTTP ${res.status}: ${errorText || res.statusText}`);
  }
  return { ok: true };
}

function setLight(room, on) {
  const entity = rooms.get(room);
  if (!entity) return;
  const service = `${entity.split('.')[0]}/${on ? 'turn_on' : 'turn_off'}`;
  callHomeAssistant(service, entity).catch((err) => {
    logActivity('error', `Home Assistant Fehler (${room}): ${err.message}`);
  });
}

const initialCalibration = loadCalibration();
const initialSettings = loadSettings();

const follow = createFollowEngine({
  rooms,
  users: activeUsers,
  setLight,
  options: {
    maxAgeMs: Number(process.env.RSSI_MAX_AGE_MS || 8000),
    hysteresisDb: Number(process.env.HYSTERESIS_DB || 6),
    minDwellMs: Number(process.env.MIN_DWELL_MS || 5000),
    offDelayMs: Number(process.env.OFF_DELAY_MS || 5000),
  },
  onRoomSwitch: (user, room, prevRoom) => {
    logActivity('presence', `${user.name}: Raum erkannt → ${room}`, { room, prevRoom });
  },
  onLightChange: (room, isLit, trigger) => {
    const note = trigger === 'path' ? ' (Pfad-Beleuchtung)' : '';
    logActivity('light', `Licht ${room}: ${isLit ? 'AN' : 'AUS'}${note}`, { room, isLit });
  },
});

follow.setCalibration(initialCalibration);
if (initialSettings.pathLighting) {
  follow.setPathLighting(initialSettings.pathLighting);
}

setInterval(() => {
  pruneUsers();
  follow.evaluate();
}, 1000);

// PWA Web App Manifest
app.get('/manifest.webmanifest', (_req, res) => {
  res.type('application/manifest+json').send(JSON.stringify({
    name: 'Raum-Tracking Smart Home',
    short_name: 'RaumTracking',
    description: 'Präsenzbasiertes Raum-Tracking und Home Assistant Steuerung',
    start_url: '/',
    display: 'standalone',
    background_color: '#090d16',
    theme_color: '#0f172a',
    icons: [
      {
        src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="128" fill="%232563eb"/><path d="M256 110c-80.6 0-146 65.4-146 146 0 46.7 22.1 88.3 56.4 115.1l17.7-22.6c-27.8-21.7-45.7-55.5-45.7-93.5 0-65.1 52.9-118 118-118s118 52.9 118 118c0 38-17.9 71.8-45.7 93.5l17.7 22.6C425.9 344.3 448 302.7 448 256c0-80.6-65.4-146-146-146zm-64 146c0-35.3 28.7-64 64-64s64 28.7 64 64c0 23.3-12.5 43.8-31.2 55.1l-14-17.8c11.9-7.2 19.8-20.2 19.8-35 0-22.1-17.9-40-40-40s-40 17.9-40 40c0 14.8 7.9 27.8 19.8 35l-14 17.8C204.5 299.8 192 279.3 192 256zm64-24a24 24 0 100 48 24 24 0 000-48z" fill="%23ffffff"/><circle cx="256" cy="410" r="16" fill="%2338bdf8"/></svg>',
        sizes: '192x192 512x512',
        type: 'image/svg+xml',
        purpose: 'any maskable'
      }
    ]
  }));
});

// App Frontend
app.get('/', (_req, res) => {
  res.type('html').send(fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8'));
});
app.use(express.static(__dirname));

// Client Presence Heartbeat / Registration
app.post('/api/presence', (req, res) => {
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (_) {
      body = {};
    }
  }

  const { id, name, active, follow: wantsFollow, mac, bleSignals } = body || {};
  if (typeof id !== 'string' || id.length < 4 || id.length > 64) {
    return res.status(400).json({ ok: false, error: 'Ungültige Tracker-ID' });
  }

  if (!active) {
    const wasPresent = activeUsers.delete(id);
    if (wasPresent) {
      logActivity('presence', `Nutzer hat Tracking beendet: ${name || 'Nutzer'}`);
    }
    return res.json({
      ok: true,
      active: isTrackingActive(),
      users: activeUsers.size,
      rooms: Array.from(rooms.keys()),
      litRooms: follow.getLitRooms(),
    });
  }

  const followMac = wantsFollow ? normalizeMac(mac) : null;
  if (wantsFollow && !followMac) {
    return res.status(400).json({ ok: false, error: 'Bitte gib eine gültige WLAN-MAC-Adresse ein.' });
  }

  const displayName = String(name || 'Mein Smartphone').slice(0, 40);
  const prev = activeUsers.get(id);
  if (!prev) {
    logActivity('presence', `Nutzer aktiv: ${displayName}${followMac ? ` (${followMac})` : ''}`);
  }

  activeUsers.set(id, {
    name: displayName,
    lastSeen: Date.now(),
    follow: Boolean(wantsFollow),
    mac: followMac,
    room: prev?.room || null,
    roomSince: prev?.roomSince || 0,
  });

  // Process incoming BLE beacon reports forwarded by the smartphone
  if (wantsFollow && followMac && bleSignals && typeof bleSignals === 'object') {
    const now = Date.now();
    for (const [bRoom, bRssi] of Object.entries(bleSignals)) {
      if (rooms.has(bRoom) && Number.isFinite(Number(bRssi))) {
        follow.addReading(followMac, bRoom, Number(bRssi), now);
      }
    }
  }

  const currentUser = activeUsers.get(id);
  const signals = followMac ? follow.getReadingsForMac(followMac) : {};

  res.json({
    ok: true,
    active: true,
    users: activeUsers.size,
    room: currentUser.room,
    litRooms: follow.getLitRooms(),
    signals,
    rooms: Array.from(rooms.keys()),
    calibration: follow.getCalibration(),
    pathLighting: follow.getPathLighting(),
    haConfigured: Boolean(HA_URL && HA_TOKEN),
    recentLogs: activityLog.slice(0, 8),
  });
});

// Full state for the mobile dashboard
app.get('/api/status', (_req, res) => {
  const roomList = Array.from(rooms.entries()).map(([roomKey, entity]) => ({
    id: roomKey,
    entity,
    lit: follow.isLit(roomKey),
  }));

  res.json({
    active: isTrackingActive(),
    usersCount: activeUsers.size,
    users: Array.from(activeUsers.values()).map((u) => ({
      name: u.name,
      room: u.room,
      follow: u.follow,
    })),
    rooms: roomList,
    litRooms: follow.getLitRooms(),
    calibration: follow.getCalibration(),
    pathLighting: follow.getPathLighting(),
    haConfigured: Boolean(HA_URL && HA_TOKEN),
    haUrl: HA_URL || '',
    recentLogs: activityLog.slice(0, 20),
  });
});

// Webhook for iOS Shortcuts / Android Routines (e.g. GET /api/action/start?mac=... or stop)
app.all(['/api/action/start', '/api/action/stop'], (req, res) => {
  const isStart = req.path.endsWith('/start');
  const params = req.method === 'POST' ? req.body : req.query;
  const rawMac = params.mac || params.MAC;
  const mac = normalizeMac(rawMac);
  const name = params.name ? String(params.name).slice(0, 40) : (mac ? `Gerät ${mac.slice(-5)}` : 'Smartphone');
  let id = params.id;
  if (!id && mac) {
    id = `tracker-${mac.replace(/:/g, '')}`;
  } else if (!id) {
    id = 'webhook-user';
  }

  if (isStart) {
    activeUsers.set(id, {
      name,
      lastSeen: Date.now(),
      follow: Boolean(mac),
      mac: mac || null,
      room: null,
      roomSince: 0,
    });
    logActivity('webhook', `Webhook: Tracking gestartet für ${name}${mac ? ` (${mac})` : ''}`);
    return res.json({
      ok: true,
      active: true,
      message: `Tracking gestartet für ${name}`,
      user: { id, name, mac },
    });
  } else {
    let removed = false;
    if (activeUsers.has(id)) {
      activeUsers.delete(id);
      removed = true;
    } else if (mac) {
      for (const [uid, u] of activeUsers.entries()) {
        if (u.mac === mac) {
          activeUsers.delete(uid);
          removed = true;
        }
      }
    }
    logActivity('webhook', `Webhook: Tracking beendet für ${name}`);
    return res.json({
      ok: true,
      active: isTrackingActive(),
      message: `Tracking beendet (${removed ? 'Nutzer abgemeldet' : 'Kein aktiver Nutzer gefunden'})`,
    });
  }
});

// Calibration Endpoints
app.get('/api/calibration', (_req, res) => {
  res.json({ ok: true, offsets: follow.getCalibration() });
});

app.post('/api/calibration', (req, res) => {
  const { room, offset, offsets } = req.body || {};
  let current = follow.getCalibration();
  if (offsets && typeof offsets === 'object') {
    current = { ...current, ...offsets };
  } else if (room && typeof offset === 'number') {
    current[room] = Math.max(-30, Math.min(30, Math.round(offset)));
  }
  follow.setCalibration(current);
  saveCalibration(current);
  logActivity('system', `Kalibrierung aktualisiert: ${JSON.stringify(current)}`);
  res.json({ ok: true, offsets: current });
});

// Settings Endpoints (Path-Lighting etc.)
app.get('/api/settings', (_req, res) => {
  res.json({
    ok: true,
    pathLighting: follow.getPathLighting(),
  });
});

app.post('/api/settings', (req, res) => {
  const { pathLighting } = req.body || {};
  if (pathLighting) {
    follow.setPathLighting(pathLighting);
    saveSettings({ pathLighting: follow.getPathLighting() });
    logActivity('system', `Pfad-Beleuchtung aktualisiert: ${pathLighting.enabled ? 'Aktiviert' : 'Deaktiviert'} (Flur: ${pathLighting.hallwayRoom || 'Keiner'}, ${pathLighting.durationSec || 30}s)`);
  }
  res.json({ ok: true, pathLighting: follow.getPathLighting() });
});

// ESP32 Node endpoint
app.get('/api/node', (_req, res) => {
  const lines = [`tracking=${isTrackingActive() ? 1 : 0}`];
  for (const mac of follow.followedMacs()) lines.push(`mac=${mac}`);
  res.type('text/plain').send(lines.join('\n') + '\n');
});

// ESP32 RSSI reports
app.post('/api/rssi', (req, res) => {
  const { room, readings } = req.body || {};
  if (!rooms.has(room) || !Array.isArray(readings)) {
    return res.status(400).json({ ok: false });
  }
  const followed = follow.followedMacs();
  const now = Date.now();
  for (const reading of readings) {
    const mac = normalizeMac(reading && reading.mac);
    const rssi = Number(reading && reading.rssi);
    if (mac && followed.has(mac) && Number.isFinite(rssi)) {
      follow.addReading(mac, room, rssi, now);
    }
  }
  res.json({ ok: true });
});

// Sound / Clap events from ESP32
app.post('/track', async (req, res) => {
  if (!isTrackingActive()) {
    return res.status(202).json({ ok: false, ignored: true });
  }

  const event = req.body || {};
  console.log(`[${new Date().toISOString()}] /track`, JSON.stringify(event));
  res.json({ ok: true });

  if (event.event === 'clap') {
    const roomEntity = rooms.get(event.room);
    const entity = roomEntity || HA_ENTITY_ID;
    const service = roomEntity ? `${roomEntity.split('.')[0]}/toggle` : HA_SERVICE;
    const isDouble = Boolean(event.double);
    logActivity('clap', `${isDouble ? 'Doppel-Klatschen' : 'Klatschen'} erkannt im Raum: ${event.room || 'Standard'}`);
    try {
      await callHomeAssistant(service, entity);
      logActivity('light', `Licht umgeschaltet (${entity}) durch Klatschen`);
    } catch (err) {
      logActivity('error', `Home Assistant Umschalten fehlgeschlagen: ${err.message}`);
    }
  }
});

// Mobile Action: Manual Room Light Toggle
app.post('/api/action/toggle-light', async (req, res) => {
  const { room } = req.body || {};
  const entity = rooms.get(room);
  if (!entity) {
    return res.status(400).json({ ok: false, error: 'Unbekannter Raum' });
  }
  const service = `${entity.split('.')[0]}/toggle`;
  try {
    await callHomeAssistant(service, entity);
    logActivity('light', `Manuell umgeschaltet: ${room} (${entity})`);
    res.json({ ok: true, room, entity });
  } catch (err) {
    logActivity('error', `Manuelles Umschalten fehlgeschlagen (${room}): ${err.message}`);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Mobile Action: Simulate Clap
app.post('/api/action/simulate-clap', async (req, res) => {
  const { room } = req.body || {};
  const roomEntity = rooms.get(room);
  const entity = roomEntity || HA_ENTITY_ID;
  const service = roomEntity ? `${roomEntity.split('.')[0]}/toggle` : HA_SERVICE;
  logActivity('clap', `Test-Klatschen (Doppelklatsch) simuliert für ${room || 'Standard'}`);
  try {
    await callHomeAssistant(service, entity);
    logActivity('light', `Test-Klatschen ausgeführt (${entity})`);
    res.json({ ok: true, room, entity });
  } catch (err) {
    logActivity('error', `Test-Klatschen fehlgeschlagen: ${err.message}`);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

app.use((req, res, next) => {
  if (req.path === '/' || req.path === '/index.html') {
    return res.type('html').send(fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8'));
  }
  next();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}, ${rooms.size} rooms configured`);
});
