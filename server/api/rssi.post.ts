import { rooms, getFollowedMacs, normalizeMac, addReading } from '../utils/followEngine'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({})) || {}
  const { room, readings } = body

  if (!rooms.has(room) || !Array.isArray(readings)) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request' })
  }

  const followed = getFollowedMacs()
  const now = Date.now()

  for (const reading of readings) {
    const mac = normalizeMac(reading && reading.mac)
    const rssi = Number(reading && reading.rssi)
    if (mac && followed.has(mac) && Number.isFinite(rssi)) {
      addReading(mac, room, rssi, now)
    }
  }

  return { ok: true }
})
