import { getCalibration, updateCalibration, updateRoomCalibration } from '../utils/followEngine'
import { logActivity } from '../utils/activityLogger'

export default defineEventHandler(async (event) => {
  if (event.method === 'GET') {
    return { ok: true, offsets: getCalibration() }
  }

  const body = await readBody(event).catch(() => ({})) || {}
  const { room, offset, offsets } = body

  if (offsets && typeof offsets === 'object') {
    updateCalibration(offsets)
  } else if (room && typeof offset === 'number') {
    updateRoomCalibration(room, offset)
  }

  const current = getCalibration()
  logActivity('system', `Kalibrierung aktualisiert: ${JSON.stringify(current)}`)
  return { ok: true, offsets: current }
})
