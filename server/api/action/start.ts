import { activeUsers, normalizeMac } from '../../utils/followEngine'
import { logActivity } from '../../utils/activityLogger'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const body = event.method === 'POST' ? await readBody(event).catch(() => ({})) || {} : {}
  const rawMac = (body.mac || query.mac || query.MAC) as string
  const mac = normalizeMac(rawMac)
  const rawName = (body.name || query.name) as string
  const name = rawName ? String(rawName).slice(0, 40) : (mac ? `Gerät ${mac.slice(-5)}` : 'Smartphone')
  let id = (body.id || query.id) as string

  if (!id && mac) {
    id = `tracker-${mac.replace(/:/g, '')}`
  } else if (!id) {
    id = 'webhook-user'
  }

  activeUsers.set(id, {
    name,
    lastSeen: Date.now(),
    follow: Boolean(mac),
    mac: mac || null,
    room: null,
    roomSince: 0,
  })

  logActivity('webhook', `Webhook: Tracking gestartet für ${name}${mac ? ` (${mac})` : ''}`)

  return {
    ok: true,
    active: true,
    message: `Tracking gestartet für ${name}`,
    user: { id, name, mac },
  }
})
