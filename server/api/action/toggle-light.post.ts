import { rooms } from '../../utils/followEngine'
import { callHomeAssistant } from '../../utils/haService'
import { logActivity } from '../../utils/activityLogger'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({})) || {}
  const { room } = body

  const entity = rooms.get(room)
  if (!entity) {
    throw createError({ statusCode: 400, statusMessage: 'Unbekannter Raum' })
  }

  const service = `${entity.split('.')[0]}/toggle`
  try {
    await callHomeAssistant(service, entity)
    logActivity('light', `Manuell umgeschaltet: ${room} (${entity})`)
    return { ok: true, room, entity }
  } catch (err: any) {
    logActivity('error', `Manuelles Umschalten fehlgeschlagen (${room}): ${err.message}`)
    throw createError({ statusCode: 500, statusMessage: err.message })
  }
})
