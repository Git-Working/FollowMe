function normalizeMac(value) {
  const mac = String(value || '').trim().toLowerCase().replace(/-/g, ':');
  return /^([0-9a-f]{2}:){5}[0-9a-f]{2}$/.test(mac) ? mac : null;
}

function createFollowEngine({ rooms, users, setLight, options = {}, onRoomSwitch = null, onLightChange = null }) {
  const {
    maxAgeMs = 8000,
    hysteresisDb = 6,
    minDwellMs = 5000,
    offDelayMs = 5000,
    alpha = 0.4,
  } = options;

  const readings = new Map();
  const lit = new Set();
  const emptySince = new Map();

  // Calibration Offsets: room -> offsetDb
  let calibrationOffsets = {};

  // Path Lighting (Flur-Licht mitnehmen)
  let pathLighting = {
    enabled: false,
    hallwayRoom: '',
    durationMs: 30000,
  };
  let pathLitUntil = 0;

  function followedMacs() {
    const macs = new Set();
    for (const user of users.values()) {
      if (user.follow && user.mac) macs.add(user.mac);
    }
    return macs;
  }

  function addReading(mac, room, rssi, now = Date.now()) {
    if (!rooms.has(room)) return;
    let perRoom = readings.get(mac);
    if (!perRoom) {
      perRoom = new Map();
      readings.set(mac, perRoom);
    }
    const prev = perRoom.get(room);
    const fresh = prev && now - prev.ts <= maxAgeMs;
    const smoothed = fresh ? prev.rssi + alpha * (rssi - prev.rssi) : rssi;
    perRoom.set(room, { rssi: smoothed, ts: now });
  }

  function triggerPathLighting(now) {
    if (!pathLighting.enabled || !pathLighting.hallwayRoom) return;
    const hall = pathLighting.hallwayRoom;
    if (!rooms.has(hall)) return;

    pathLitUntil = now + (pathLighting.durationMs || 30000);
    if (!lit.has(hall)) {
      lit.add(hall);
      setLight(hall, true);
      if (typeof onLightChange === 'function') {
        try {
          onLightChange(hall, true, 'path');
        } catch (_) {}
      }
    }
  }

  function switchRoom(user, room, now) {
    const prevRoom = user.room;
    console.log(`Follow: ${user.name} -> ${room}`);
    user.room = room;
    user.roomSince = now;

    // Check Path Lighting trigger:
    // If transitioning between rooms and neither is the hallway itself
    if (prevRoom && prevRoom !== room && pathLighting.enabled && pathLighting.hallwayRoom) {
      if (prevRoom !== pathLighting.hallwayRoom && room !== pathLighting.hallwayRoom) {
        triggerPathLighting(now);
      }
    }

    if (typeof onRoomSwitch === 'function') {
      try {
        onRoomSwitch(user, room, prevRoom);
      } catch (err) {
        console.error('onRoomSwitch error:', err.message);
      }
    }
    return room;
  }

  function pickRoom(user, now) {
    const perRoom = readings.get(user.mac);
    let best = null;
    let current = null;
    if (perRoom) {
      for (const [room, sample] of perRoom) {
        if (now - sample.ts > maxAgeMs) continue;
        const offset = Number(calibrationOffsets[room] || 0);
        const effectiveRssi = sample.rssi + offset;

        if (!best || effectiveRssi > best.effectiveRssi) {
          best = { room, rssi: sample.rssi, effectiveRssi };
        }
        if (room === user.room) {
          current = { room, rssi: sample.rssi, effectiveRssi };
        }
      }
    }
    if (!best) return user.room || null;
    if (!user.room || !current) return switchRoom(user, best.room, now);
    const clearlyBetter = best.effectiveRssi >= current.effectiveRssi + hysteresisDb;
    const dwelled = now - (user.roomSince || 0) >= minDwellMs;
    if (best.room !== user.room && clearlyBetter && dwelled) {
      return switchRoom(user, best.room, now);
    }
    return user.room;
  }

  function evaluate(now = Date.now()) {
    const followed = followedMacs();
    for (const mac of readings.keys()) {
      if (!followed.has(mac)) readings.delete(mac);
    }

    const occupied = new Set();
    for (const user of users.values()) {
      if (!user.follow) {
        user.room = null;
        continue;
      }
      const room = pickRoom(user, now);
      if (room) occupied.add(room);
    }

    // Turn ON lights for occupied rooms
    for (const room of occupied) {
      emptySince.delete(room);
      if (!lit.has(room)) {
        lit.add(room);
        setLight(room, true);
        if (typeof onLightChange === 'function') {
          try {
            onLightChange(room, true);
          } catch (err) {
            console.error('onLightChange error:', err.message);
          }
        }
      }
    }

    // Turn OFF lights for unoccupied rooms
    for (const room of [...lit]) {
      if (occupied.has(room)) continue;

      // Keep hallway on if path lighting is still active
      if (pathLighting.enabled && room === pathLighting.hallwayRoom && now < pathLitUntil) {
        continue;
      }

      const since = emptySince.get(room) ?? now;
      emptySince.set(room, since);
      if (now - since >= offDelayMs) {
        lit.delete(room);
        emptySince.delete(room);
        setLight(room, false);
        if (typeof onLightChange === 'function') {
          try {
            onLightChange(room, false);
          } catch (err) {
            console.error('onLightChange error:', err.message);
          }
        }
      }
    }
  }

  function getReadingsForMac(mac) {
    if (!mac) return {};
    const perRoom = readings.get(mac);
    if (!perRoom) return {};
    const res = {};
    const now = Date.now();
    for (const [room, sample] of perRoom) {
      if (now - sample.ts <= maxAgeMs * 2) {
        const offset = Number(calibrationOffsets[room] || 0);
        res[room] = {
          rssi: Math.round(sample.rssi),
          effectiveRssi: Math.round(sample.rssi + offset),
          offset,
          ageMs: now - sample.ts,
        };
      }
    }
    return res;
  }

  function isLit(room) {
    return lit.has(room);
  }

  function getLitRooms() {
    return Array.from(lit);
  }

  function setCalibration(offsets) {
    if (typeof offsets === 'object' && offsets !== null) {
      calibrationOffsets = { ...offsets };
    }
  }

  function getCalibration() {
    return { ...calibrationOffsets };
  }

  function setPathLighting(cfg) {
    if (typeof cfg === 'object' && cfg !== null) {
      pathLighting = {
        enabled: Boolean(cfg.enabled),
        hallwayRoom: String(cfg.hallwayRoom || ''),
        durationMs: Number(cfg.durationSec || 30) * 1000,
      };
    }
  }

  function getPathLighting() {
    return {
      enabled: pathLighting.enabled,
      hallwayRoom: pathLighting.hallwayRoom,
      durationSec: Math.round(pathLighting.durationMs / 1000),
    };
  }

  return {
    addReading,
    evaluate,
    followedMacs,
    lit,
    getReadingsForMac,
    isLit,
    getLitRooms,
    setCalibration,
    getCalibration,
    setPathLighting,
    getPathLighting,
  };
}

module.exports = { normalizeMac, createFollowEngine };
