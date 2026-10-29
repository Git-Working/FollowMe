import { isTrackingActive, rooms } from '../utils/followEngine'
import { callHomeAssistant, toggleDefaultEntity } from '../utils/haService'
import { logActivity } from '../utils/activityLogger'

export default defineEventHandler(async (event) => {
  if (!isTrackingActive()) {
    setResponseStatus(event, 202)
    return { ok: false, ignored: true }
  }

  const body = await readBody(event).catch(() => ({})) || {}
  console.log(`[${new Date().toISOString()}] /track`, JSON.stringify(body))

  if (body.event === 'clap') {
    const isDouble = Boolean(body.double)
    const room = body.room
    logActivity('clap', `${isDouble ? 'Doppel-Klatschen' : 'Klatschen'} erkannt im Raum: ${room || 'Standard'}`)

    const roomEntity = rooms.get(room)
    if (roomEntity) {
      const service = `${roomEntity.split('.')[0]}/toggle`
      try {
        await callHomeAssistant(service, roomEntity)
        logActivity('light', `Licht umgeschaltet (${roomEntity}) durch Klatschen`)
      } catch (err: any) {
        logActivity('error', `Home Assistant Umschalten fehlgeschlagen: ${err.message}`)
      }
    } else {
      try {
        await toggleDefaultEntity()
        logActivity('light', `Standard-Licht umgeschaltet durch Klatschen`)
      } catch (err: any) {
        logActivity('error', `Home Assistant Umschalten fehlgeschlagen: ${err.message}`)
      }
    }
  }

  return { ok: true }
})
