export interface ActiveUser {
  name: string
  lastSeen: number
  follow: boolean
  mac: string | null
  room: string | null
  roomSince: number
}

export interface ActivityItem {
  id: string
  time: string
  type: 'system' | 'presence' | 'light' | 'clap' | 'webhook' | 'error'
  message: string
  details?: any
}

export interface PathLightingConfig {
  enabled: boolean
  hallwayRoom: string
  durationSec: number
}

export interface AppSettings {
  pathLighting: PathLightingConfig
}

export interface CalibrationData {
  [room: string]: number
}

export interface RoomReading {
  rssi: number
  effectiveRssi?: number
  offset?: number
  ageMs: number
}
