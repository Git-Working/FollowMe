import { getPathLighting, updatePathLighting } from '../../utils/followEngine'
import { logActivity } from '../../utils/activityLogger'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const body = event.method === 'POST' ? await readBody(event).catch(() => ({})) || {} : {}

  const mode = String(body.mode || query.mode || query.type || '').toLowerCase()
  const rawState = body.state !== undefined ? body.state : query.state
  const toggle = query.toggle === '1' || body.toggle === true

  if (mode === 'path' || mode === 'pathlighting') {
    const current = getPathLighting()
    const newState = toggle ? !current.enabled : (rawState === '1' || rawState === 'true' || rawState === true)
    updatePathLighting({ enabled: newState })
    logActivity('system', `Widget: Pfad-Beleuchtung auf ${newState ? 'EIN' : 'AUS'} geschaltet`)
    return {
      ok: true,
      mode: 'pathLighting',
      enabled: newState,
      message: `Pfad-Beleuchtung ist jetzt ${newState ? 'aktiv' : 'inaktiv'}`,
    }
  }

  return {
    ok: false,
    message: 'Unbekannter Modus. Verfügbar: mode=path',
  }
})
