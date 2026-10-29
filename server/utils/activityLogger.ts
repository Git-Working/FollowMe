import type { ActivityItem } from './types'

const activityLog: ActivityItem[] = []

export function logActivity(type: ActivityItem['type'], message: string, details: any = null) {
  const item: ActivityItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    type,
    message,
    details,
  }
  activityLog.unshift(item)
  if (activityLog.length > 40) activityLog.pop()
  console.log(`[${item.time}] [${type}] ${message}`)
}

export function getActivityLogs(limit = 20): ActivityItem[] {
  return activityLog.slice(0, limit)
}
