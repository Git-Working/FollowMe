import { rooms, getFollowedMacs, normalizeMac, addReading } from '../utils/followEngine'
import { logActivity } from '../utils/activityLogger'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({})) || {}
  const { room, readings } = body

  if (!rooms.has(room) || !Array.isArray(readings)) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request' })
  }

  const followed = getFollowedMacs()
  const now = Date.now()

  let added = 0
  for (const reading of readings) {
    const mac = normalizeMac(reading && reading.mac)
    const rssi = Number(reading && reading.rssi)
    if (mac && followed.has(mac) && Number.isFinite(rssi)) {
      addReading(mac, room, rssi, now)
      added++
    }
  }

  // Diagnose: Fehlerursache direkt im Activity Feed sichtbar machen
  if (added === 0 && readings.length > 0) {
    if (followed.size === 0) {
      logActivity('error', `RSSI verworfen (${room}): kein verfolgter Nutzer mit MAC bekannt – passiert`
        + ' die App-Heartbeats gerade?')
    } else {
      const got = readings.map((r: any) => normalizeMac(r?.mac)).filter(Boolean).join(', ')
      logActivity('error', `RSSI verworfen (${room}): Empfangene MAC(s) [${got}] passt nicht zu `
        + `verfolgter MAC [${Array.from(followed).join(', ')}]`)
    }
  } else if (added > 0) {
    // Ersten Empfang einer MAC in diesem Raum loggen (kein Spam bei Folgeposts)
    const keyA = readings.map((r: any) => normalizeMac(r?.mac) + '@' + room).filter(Boolean).sort().join('|')
    const key = `first:${keyA}`
    if (!(globalThis as any)[key]) {
      ;(globalThis as any)[key] = true
      logActivity('system', `Erstes empfangenes Signal in ${room}`, { room })
      setTimeout(() => { delete (globalThis as any)[key] }, 30000)
    }
  }

  return { ok: true, added, followed: followed.size }
})
