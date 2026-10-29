import type { ActiveUser, PathLightingConfig, CalibrationData, RoomReading } from './types'
import { loadRoomsMap, saveRoomsMap, loadCalibration, loadSettings, saveCalibration, saveSettings } from './storage'
import { callHomeAssistant } from './haService'
import { logActivity } from './activityLogger'

export function normalizeMac(value: string | null | undefined): string | null {
  const mac = String(value || '').trim().toLowerCase().replace(/-/g, ':')
  return /^([0-9a-f]{2}:){5}[0-9a-f]{2}$/.test(mac) ? mac : null
}

const PRESENCE_TIMEOUT_MS = Number(process.env.PRESENCE_TIMEOUT_MS || 30000)
const RSSI_MAX_AGE_MS = Number(process.env.RSSI_MAX_AGE_MS || 8000)
const HYSTERESIS_DB = Number(process.env.HYSTERESIS_DB || 6)
const MIN_DWELL_MS = Number(process.env.MIN_DWELL_MS || 5000)
const OFF_DELAY_MS = Number(process.env.OFF_DELAY_MS || 5000)
const ALPHA = 0.4

export const rooms = loadRoomsMap()
export const activeUsers = new Map<string, ActiveUser>()

const readings = new Map<string, Map<string, { rssi: number; ts: number }>>()
const lit = new Set<string>()
const emptySince = new Map<string, number>()

let calibrationOffsets: CalibrationData = loadCalibration()
let pathLightingConfig: PathLightingConfig = loadSettings().pathLighting || {
  enabled: false,
  hallwayRoom: '',
  durationSec: 30,
}
let pathLitUntil = 0

export function pruneUsers() {
  const now = Date.now()
  for (const [id, user] of activeUsers) {
    if (now - user.lastSeen > PRESENCE_TIMEOUT_MS) {
      activeUsers.delete(id)
      logActivity('presence', `Nutzer abgemeldet (Timeout): ${user.name}`)
    }
  }
}

export function isTrackingActive(): boolean {
  pruneUsers()
  return activeUsers.size > 0
}

export function setLight(room: string, on: boolean) {
  const entity = rooms.get(room)
  if (!entity) return
  const service = `${entity.split('.')[0]}/${on ? 'turn_on' : 'turn_off'}`
  callHomeAssistant(service, entity).catch((err) => {
    logActivity('error', `Home Assistant Fehler (${room}): ${err.message}`)
  })
}

export function addReading(mac: string, room: string, rssi: number, now = Date.now()) {
  if (!rooms.has(room)) return
  let perRoom = readings.get(mac)
  if (!perRoom) {
    perRoom = new Map()
    readings.set(mac, perRoom)
  }
  const prev = perRoom.get(room)
  const fresh = prev && now - prev.ts <= RSSI_MAX_AGE_MS
  const smoothed = fresh ? prev.rssi + ALPHA * (rssi - prev.rssi) : rssi
  perRoom.set(room, { rssi: smoothed, ts: now })
}

export function triggerPathLighting(now: number) {
  if (!pathLightingConfig.enabled || !pathLightingConfig.hallwayRoom) return
  const hall = pathLightingConfig.hallwayRoom
  if (!rooms.has(hall)) return

  pathLitUntil = now + (pathLightingConfig.durationSec || 30) * 1000
  if (!lit.has(hall)) {
    lit.add(hall)
    setLight(hall, true)
    logActivity('light', `Licht ${hall}: AN (Pfad-Beleuchtung)`, { room: hall, isLit: true })
  }
}

function switchRoom(user: ActiveUser, room: string, now: number) {
  const prevRoom = user.room
  console.log(`Follow: ${user.name} -> ${room}`)
  user.room = room
  user.roomSince = now

  if (prevRoom && prevRoom !== room && pathLightingConfig.enabled && pathLightingConfig.hallwayRoom) {
    if (prevRoom !== pathLightingConfig.hallwayRoom && room !== pathLightingConfig.hallwayRoom) {
      triggerPathLighting(now)
    }
  }

  logActivity('presence', `${user.name}: Raum erkannt → ${room}`, { room, prevRoom })
  return room
}

function pickRoom(user: ActiveUser, now: number) {
  if (!user.mac) return user.room || null
  const perRoom = readings.get(user.mac)
  let best: { room: string; rssi: number; effectiveRssi: number } | null = null
  let current: { room: string; rssi: number; effectiveRssi: number } | null = null

  if (perRoom) {
    for (const [room, sample] of perRoom) {
      if (now - sample.ts > RSSI_MAX_AGE_MS) continue
      const offset = Number(calibrationOffsets[room] || 0)
      const effectiveRssi = sample.rssi + offset

      if (!best || effectiveRssi > best.effectiveRssi) {
        best = { room, rssi: sample.rssi, effectiveRssi }
      }
      if (room === user.room) {
        current = { room, rssi: sample.rssi, effectiveRssi }
      }
    }
  }

  if (!best) return user.room || null
  if (!user.room || !current) return switchRoom(user, best.room, now)

  const clearlyBetter = best.effectiveRssi >= current.effectiveRssi + HYSTERESIS_DB
  const dwelled = now - (user.roomSince || 0) >= MIN_DWELL_MS
  if (best.room !== user.room && clearlyBetter && dwelled) {
    return switchRoom(user, best.room, now)
  }
  return user.room
}

export function evaluateFollow(now = Date.now()) {
  const followed = new Set<string>()
  for (const user of activeUsers.values()) {
    if (user.follow && user.mac) followed.add(user.mac)
  }

  for (const mac of readings.keys()) {
    if (!followed.has(mac)) readings.delete(mac)
  }

  const occupied = new Set<string>()
  for (const user of activeUsers.values()) {
    if (!user.follow) {
      user.room = null
      continue
    }
    const room = pickRoom(user, now)
    if (room) occupied.add(room)
  }

  // Turn ON lights for occupied rooms
  for (const room of occupied) {
    emptySince.delete(room)
    if (!lit.has(room)) {
      lit.add(room)
      setLight(room, true)
      logActivity('light', `Licht ${room}: AN`, { room, isLit: true })
    }
  }

  // Turn OFF lights for unoccupied rooms
  for (const room of [...lit]) {
    if (occupied.has(room)) continue

    if (pathLightingConfig.enabled && room === pathLightingConfig.hallwayRoom && now < pathLitUntil) {
      continue
    }

    const since = emptySince.get(room) ?? now
    emptySince.set(room, since)
    if (now - since >= OFF_DELAY_MS) {
      lit.delete(room)
      emptySince.delete(room)
      setLight(room, false)
      logActivity('light', `Licht ${room}: AUS`, { room, isLit: false })
    }
  }
}

export function getReadingsForMac(mac: string | null): Record<string, RoomReading> {
  if (!mac) return {}
  const perRoom = readings.get(mac)
  if (!perRoom) return {}
  const res: Record<string, RoomReading> = {}
  const now = Date.now()
  for (const [room, sample] of perRoom) {
    if (now - sample.ts <= RSSI_MAX_AGE_MS * 2) {
      const offset = Number(calibrationOffsets[room] || 0)
      res[room] = {
        rssi: Math.round(sample.rssi),
        effectiveRssi: Math.round(sample.rssi + offset),
        offset,
        ageMs: now - sample.ts,
      }
    }
  }
  return res
}

export function getLitRooms(): string[] {
  return Array.from(lit)
}

export function isRoomLit(room: string): boolean {
  return lit.has(room)
}

export function getFollowedMacs(): Set<string> {
  const macs = new Set<string>()
  for (const user of activeUsers.values()) {
    if (user.follow && user.mac) macs.add(user.mac)
  }
  return macs
}

export function getCalibration(): CalibrationData {
  return { ...calibrationOffsets }
}

export function updateCalibration(offsets: CalibrationData) {
  calibrationOffsets = { ...calibrationOffsets, ...offsets }
  saveCalibration(calibrationOffsets)
}

export function updateRoomCalibration(room: string, offset: number) {
  calibrationOffsets[room] = Math.max(-30, Math.min(30, Math.round(offset)))
  saveCalibration(calibrationOffsets)
}

export function getPathLighting(): PathLightingConfig {
  return { ...pathLightingConfig }
}

export function updatePathLighting(cfg: Partial<PathLightingConfig>) {
  pathLightingConfig = {
    enabled: cfg.enabled !== undefined ? Boolean(cfg.enabled) : pathLightingConfig.enabled,
    hallwayRoom: cfg.hallwayRoom !== undefined ? String(cfg.hallwayRoom) : pathLightingConfig.hallwayRoom,
    durationSec: cfg.durationSec !== undefined ? Number(cfg.durationSec) : pathLightingConfig.durationSec,
  }
  saveSettings({ pathLighting: pathLightingConfig })
}

export function updateRooms(newRooms: Record<string, string>) {
  rooms.clear()
  for (const [key, val] of Object.entries(newRooms)) {
    const cleanKey = key.trim().toLowerCase()
    const cleanVal = val.trim()
    if (cleanKey && cleanVal) {
      rooms.set(cleanKey, cleanVal)
    }
  }
  const obj: Record<string, string> = {}
  for (const [k, v] of rooms.entries()) {
    obj[k] = v
  }
  saveRoomsMap(obj)
}
