import { getPathLighting, updatePathLighting } from '../utils/followEngine'
import { logActivity } from '../utils/activityLogger'

export default defineEventHandler(async (event) => {
  if (event.method === 'GET') {
    return { ok: true, pathLighting: getPathLighting() }
  }

  const body = await readBody(event).catch(() => ({})) || {}
  const { pathLighting } = body

  if (pathLighting) {
    updatePathLighting(pathLighting)
    const current = getPathLighting()
    logActivity(
      'system',
      `Pfad-Beleuchtung aktualisiert: ${current.enabled ? 'Aktiviert' : 'Deaktiviert'} (Flur: ${current.hallwayRoom || 'Keiner'}, ${current.durationSec || 30}s)`
    )
  }

  return { ok: true, pathLighting: getPathLighting() }
})
