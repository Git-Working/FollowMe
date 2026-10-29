import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useHaptics } from './useHaptics'
import { useWakeLock } from './useWakeLock'

export interface RoomSignal {
  rssi: number
  effectiveRssi?: number
  offset?: number
  ageMs?: number
}

export interface ActivityItem {
  id: string
  time: string
  type: 'system' | 'presence' | 'light' | 'clap' | 'webhook' | 'error'
  message: string
}

export function useTracker() {
  const { vibrate } = useHaptics()
  const { request: requestWakeLock, release: releaseWakeLock } = useWakeLock()

  const active = ref(false)
  const currentRoom = ref<string | null>(null)
  const knownRooms = ref<string[]>([])
  const litRooms = ref<string[]>([])
  const roomSignals = reactive<Record<string, RoomSignal>>({})
  const usersCount = ref(0)
  const haConfigured = ref(false)
  const haUrl = ref('')
  const recentLogs = ref<ActivityItem[]>([])
  const errorMsg = ref('')

  // User Settings
  const trackerId = ref('')
  const name = ref('')
  const mac = ref('')
  const follow = ref(true)
  const keepScreenAwake = ref(false)

  const HEARTBEAT_ACTIVE_MS = 3000
  const HEARTBEAT_IDLE_MS = 10000
  const MAC_PATTERN = /^([0-9a-f]{2}[:-]){5}[0-9a-f]{2}$/i
  let heartbeatTimer: any = null

  function generateUUID(): string {
    // crypto.randomUUID() ist nur unter HTTPS verfügbar — Fallback für HTTP im lokalen Netz
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
    // RFC 4122-konformer UUID v4 Fallback
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  function initLocalState() {
    if (typeof window === 'undefined') return
    let storedId = localStorage.getItem('rt_trackerId')
    if (!storedId) {
      storedId = generateUUID()
      localStorage.setItem('rt_trackerId', storedId)
    }
    trackerId.value = storedId
    name.value = localStorage.getItem('rt_name') || ''
    mac.value = localStorage.getItem('rt_mac') || ''
    follow.value = localStorage.getItem('rt_follow') !== '0'
    keepScreenAwake.value = localStorage.getItem('rt_wakeLock') === '1'
  }

  function saveLocalState() {
    if (typeof window === 'undefined') return
    localStorage.setItem('rt_name', name.value.trim())
    localStorage.setItem('rt_mac', mac.value.trim())
    localStorage.setItem('rt_follow', follow.value ? '1' : '0')
    localStorage.setItem('rt_wakeLock', keepScreenAwake.value ? '1' : '0')
  }

  async function sendPresence(isActive: boolean) {
    const payload = {
      id: trackerId.value,
      name: name.value.trim() || 'Mein Smartphone',
      active: isActive,
      follow: follow.value,
      mac: mac.value.trim(),
    }

    const res = await $fetch<any>('/api/presence', {
      method: 'POST',
      body: payload,
    })
    return res
  }

  async function heartbeat() {
    try {
      const data = await sendPresence(true)
      currentRoom.value = data.room || null
      litRooms.value = data.litRooms || []
      if (Array.isArray(data.rooms)) knownRooms.value = data.rooms
      if (data.users !== undefined) usersCount.value = data.users
      haConfigured.value = Boolean(data.haConfigured)
      if (data.recentLogs) recentLogs.value = data.recentLogs

      if (data.signals) {
        Object.assign(roomSignals, data.signals)
      }
      errorMsg.value = ''
    } catch (err: any) {
      console.warn('Heartbeat error:', err.message)
    }

    if (active.value) {
      heartbeatTimer = setTimeout(heartbeat, follow.value ? HEARTBEAT_ACTIVE_MS : HEARTBEAT_IDLE_MS)
    }
  }

  async function start() {
    vibrate(25)
    errorMsg.value = ''

    if (follow.value) {
      const trimmedMac = mac.value.trim()
      if (!MAC_PATTERN.test(trimmedMac)) {
        errorMsg.value = 'Bitte eine gültige WLAN-MAC-Adresse angeben (z.B. AA:BB:CC:DD:EE:FF).'
        return
      }
    }

    try {
      const data = await sendPresence(true)
      currentRoom.value = data.room || null
      litRooms.value = data.litRooms || []
      if (Array.isArray(data.rooms)) knownRooms.value = data.rooms
      if (data.signals) Object.assign(roomSignals, data.signals)
    } catch (err: any) {
      errorMsg.value = err.message || 'Verbindung zum Server fehlgeschlagen'
      return
    }

    saveLocalState()
    active.value = true
    if (keepScreenAwake.value) requestWakeLock()

    heartbeatTimer = setTimeout(heartbeat, follow.value ? HEARTBEAT_ACTIVE_MS : HEARTBEAT_IDLE_MS)
  }

  async function stop() {
    vibrate(15)
    clearTimeout(heartbeatTimer)
    active.value = false
    currentRoom.value = null
    releaseWakeLock()

    try {
      const data = await sendPresence(false)
      litRooms.value = data.litRooms || []
    } catch (_) {}
  }

  async function toggleTracking() {
    if (active.value) {
      await stop()
    } else {
      await start()
    }
  }

  async function fetchStatus() {
    vibrate(10)
    try {
      const data = await $fetch<any>('/api/status')
      knownRooms.value = data.rooms.map((r: any) => r.id)
      litRooms.value = data.litRooms || []
      usersCount.value = data.usersCount || 0
      haConfigured.value = Boolean(data.haConfigured)
      haUrl.value = data.haUrl || ''
      if (data.recentLogs) recentLogs.value = data.recentLogs
    } catch (_) {}
  }

  async function toggleRoomLight(room: string) {
    vibrate(20)
    try {
      await $fetch('/api/action/toggle-light', {
        method: 'POST',
        body: { room },
      })
      await fetchStatus()
    } catch (err: any) {
      errorMsg.value = `Fehler beim Umschalten: ${err.message}`
    }
  }

  async function simulateClap() {
    vibrate(35)
    try {
      const targetRoom = currentRoom.value || (knownRooms.value.length > 0 ? knownRooms.value[0] : null)
      await $fetch('/api/action/simulate-clap', {
        method: 'POST',
        body: { room: targetRoom },
      })
      await fetchStatus()
    } catch (err: any) {
      errorMsg.value = `Klatsch-Test Fehler: ${err.message}`
    }
  }

  function handlePageHide() {
    if (!active.value) return
    const blob = new Blob([JSON.stringify({ id: trackerId.value, active: false })], {
      type: 'application/json',
    })
    navigator.sendBeacon('/api/presence', blob)
  }

  function checkUrlActions() {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const action = params.get('action')
    if (action === 'start') {
      setTimeout(() => {
        start()
      }, 400)
    } else if (action === 'stop') {
      setTimeout(() => {
        stop()
      }, 400)
    } else if (action === 'clap') {
      setTimeout(() => {
        simulateClap()
      }, 600)
    }
    if (action) {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }

  onMounted(() => {
    initLocalState()
    fetchStatus()
    checkUrlActions()
    window.addEventListener('pagehide', handlePageHide)
  })

  onBeforeUnmount(() => {
    clearTimeout(heartbeatTimer)
    releaseWakeLock()
    window.removeEventListener('pagehide', handlePageHide)
  })

  return {
    active,
    currentRoom,
    knownRooms,
    litRooms,
    roomSignals,
    usersCount,
    haConfigured,
    haUrl,
    recentLogs,
    errorMsg,
    trackerId,
    name,
    mac,
    follow,
    keepScreenAwake,
    start,
    stop,
    toggleTracking,
    fetchStatus,
    toggleRoomLight,
    simulateClap,
    saveLocalState,
  }
}
