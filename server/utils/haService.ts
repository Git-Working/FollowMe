import { logActivity } from './activityLogger'

const HA_URL = process.env.HA_URL
const HA_TOKEN = process.env.HA_TOKEN
const HA_ENTITY_ID = process.env.HA_ENTITY_ID
const HA_SERVICE = process.env.HA_SERVICE || 'switch/toggle'

export function isHaConfigured(): boolean {
  return Boolean(HA_URL && HA_TOKEN)
}

export function getHaUrl(): string {
  return HA_URL || ''
}

export async function callHomeAssistant(service: string, entityId: string) {
  if (!HA_URL || !HA_TOKEN || !entityId) {
    console.warn('Home Assistant not configured or missing entityId')
    return { ok: false, reason: 'unconfigured' }
  }

  // Auto-fix missing domain prefix (z.B. "shelly1mini_..." -> "switch.shelly1mini_...")
  let targetEntity = entityId.trim()
  if (!targetEntity.includes('.')) {
    const domain = service.split('/')[0] || 'switch'
    targetEntity = `${domain}.${targetEntity}`
  }

  const cleanUrl = `${HA_URL.replace(/\/$/, '')}/api/services/${service}`
  const res = await fetch(cleanUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HA_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ entity_id: targetEntity }),
  })
  if (!res.ok) {
    const errorText = await res.text().catch(() => '')
    throw new Error(`Home Assistant HTTP ${res.status}: ${errorText || res.statusText}`)
  }
  return { ok: true }
}

export function toggleDefaultEntity() {
  const entity = HA_ENTITY_ID
  const service = HA_SERVICE
  if (!entity) return Promise.resolve({ ok: false })
  return callHomeAssistant(service, entity)
}
