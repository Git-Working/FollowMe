import { activeUsers, normalizeMac, isTrackingActive } from '../../utils/followEngine'
import { logActivity } from '../../utils/activityLogger'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const body = event.method === 'POST' ? await readBody(event).catch(() => ({})) || {} : {}
  const rawMac = (body.mac || query.mac || query.MAC) as string
  const mac = normalizeMac(rawMac)
  const id = (body.id || query.id) as string

  let removed = false
  if (id && activeUsers.has(id)) {
    activeUsers.delete(id)
    removed = true
  } else if (mac) {
    for (const [uid, u] of activeUsers.entries()) {
      if (u.mac === mac) {
        activeUsers.delete(uid)
        removed = true
      }
    }
  }

  logActivity('webhook', `Webhook: Tracking beendet (${mac || id || 'Unbekannt'})`)

  return {
    ok: true,
    active: isTrackingActive(),
    message: `Tracking beendet (${removed ? 'Nutzer abgemeldet' : 'Kein aktiver Nutzer gefunden'})`,
  }
})
