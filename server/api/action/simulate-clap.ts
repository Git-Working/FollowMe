import { rooms } from '../../utils/followEngine'
import { callHomeAssistant, toggleDefaultEntity } from '../../utils/haService'
import { logActivity } from '../../utils/activityLogger'

// Akzeptiert GET und POST — GET fuer Browser/Webhook-Links, POST fuer die App-interne Nutzung
export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({})) || {}
  const query = getQuery(event)
  // room kann per Query-Parameter (?room=wohnzimmer) oder per POST-Body kommen
  const room = (body.room || query.room || '') as string

  logActivity('clap', `Klatsch-Test simuliert fuer ${room || 'Standard'}`)

  const roomEntity = room ? rooms.get(room) : null
  if (roomEntity) {
    const service = `${roomEntity.split('.')[0]}/toggle`
    try {
      await callHomeAssistant(service, roomEntity)
      logActivity('light', `Klatsch-Test ausgefuehrt (${roomEntity})`)
      return { ok: true, room, entity: roomEntity }
    } catch (err: any) {
      logActivity('error', `Klatsch-Test fehlgeschlagen fuer ${roomEntity}: ${err.message}`)
      try {
        await toggleDefaultEntity()
        logActivity('light', `Klatsch-Test ueber Standard-Fallback ausgefuehrt`)
        return { ok: true, room: 'default' }
      } catch (_) {}
      throw createError({ statusCode: 500, statusMessage: err.message })
    }
  } else {
    try {
      await toggleDefaultEntity()
      logActivity('light', `Klatsch-Test ausgefuehrt (Standard)`)
      return { ok: true, room: 'default' }
    } catch (err: any) {
      logActivity('error', `Klatsch-Test fehlgeschlagen: ${err.message}`)
      throw createError({ statusCode: 500, statusMessage: err.message })
    }
  }
})
