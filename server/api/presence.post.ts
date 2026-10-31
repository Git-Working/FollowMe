import {
  activeUsers,
  isTrackingActive,
  normalizeMac,
  getLitRooms,
  getReadingsForMac,
  rooms,
  addReading,
  getCalibration,
  getPathLighting,
} from '../utils/followEngine'
import { isHaConfigured } from '../utils/haService'
import { logActivity, getActivityLogs } from '../utils/activityLogger'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({})) || {}
  const { id, name, active, follow: wantsFollow, mac, bleSignals } = body

  if (typeof id !== 'string' || id.length < 4 || id.length > 64) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültige Tracker-ID' })
  }

  if (!active) {
    const wasPresent = activeUsers.delete(id)
    if (wasPresent) {
      logActivity('presence', `Nutzer hat Tracking beendet: ${name || 'Nutzer'}`)
    }
    return {
      ok: true,
      active: isTrackingActive(),
      users: activeUsers.size,
      rooms: Array.from(rooms.keys()),
      litRooms: getLitRooms(),
    }
  }

  const userMac = normalizeMac(mac)

  const displayName = String(name || 'Mein Smartphone').slice(0, 40)
  const prev = activeUsers.get(id)
  if (!prev) {
    logActivity('presence', `Nutzer aktiv: ${displayName}${userMac ? ` (${userMac})` : ''}`)
  }

  activeUsers.set(id, {
    name: displayName,
    lastSeen: Date.now(),
    follow: Boolean(wantsFollow),
    mac: userMac,
    room: prev?.room || null,
    roomSince: prev?.roomSince || 0,
  })

  // Support BLE beacons from smartphone
  if (userMac && bleSignals && typeof bleSignals === 'object') {
    const now = Date.now()
    for (const [bRoom, bRssi] of Object.entries(bleSignals)) {
      if (rooms.has(bRoom) && Number.isFinite(Number(bRssi))) {
        addReading(userMac, bRoom, Number(bRssi), now)
      }
    }
  }

  const currentUser = activeUsers.get(id)!
  const signals = userMac ? getReadingsForMac(userMac) : {}

  return {
    ok: true,
    active: true,
    users: activeUsers.size,
    room: currentUser.room,
    litRooms: getLitRooms(),
    signals,
    rooms: Array.from(rooms.keys()),
    calibration: getCalibration(),
    pathLighting: getPathLighting(),
    haConfigured: isHaConfigured(),
    recentLogs: getActivityLogs(8),
  }
})
