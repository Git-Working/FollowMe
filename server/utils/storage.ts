import fs from 'node:fs'
import path from 'node:path'
import type { AppSettings, CalibrationData } from './types'

const rootDir = process.cwd()
const ROOMS_FILE = process.env.ROOMS_FILE || path.join(rootDir, 'rooms.json')
const CALIBRATION_FILE = path.join(rootDir, 'calibration.json')
const SETTINGS_FILE = path.join(rootDir, 'settings.json')

export function loadRoomsMap(): Map<string, string> {
  try {
    if (fs.existsSync(ROOMS_FILE)) {
      return new Map(Object.entries(JSON.parse(fs.readFileSync(ROOMS_FILE, 'utf8'))))
    }
  } catch (err: any) {
    console.warn(`No rooms loaded from ${ROOMS_FILE}: ${err.message}`)
  }
  return new Map()
}

export function saveRoomsMap(data: Record<string, string>) {
  try {
    fs.writeFileSync(ROOMS_FILE, JSON.stringify(data, null, 2), 'utf8')
  } catch (e: any) {
    console.error(`Could not save rooms: ${e.message}`)
  }
}

export function loadCalibration(): CalibrationData {
  try {
    if (fs.existsSync(CALIBRATION_FILE)) {
      return JSON.parse(fs.readFileSync(CALIBRATION_FILE, 'utf8')) || {}
    }
  } catch (e: any) {
    console.warn(`Could not load calibration: ${e.message}`)
  }
  return {}
}

export function saveCalibration(data: CalibrationData) {
  try {
    fs.writeFileSync(CALIBRATION_FILE, JSON.stringify(data, null, 2), 'utf8')
  } catch (e: any) {
    console.error(`Could not save calibration: ${e.message}`)
  }
}

export function loadSettings(): AppSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')) || {}
    }
  } catch (e: any) {
    console.warn(`Could not load settings: ${e.message}`)
  }
  return {
    pathLighting: {
      enabled: false,
      hallwayRoom: '',
      durationSec: 30,
    },
  }
}

export function saveSettings(data: AppSettings) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf8')
  } catch (e: any) {
    console.error(`Could not save settings: ${e.message}`)
  }
}
