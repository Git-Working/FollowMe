import { ref } from 'vue'
import { useHaptics } from './useHaptics'

export function useCalibration() {
  const { vibrate } = useHaptics()
  const calibrations = ref<Record<string, number>>({})
  const loading = ref(false)

  async function fetchCalibration() {
    loading.value = true
    try {
      const data = await $fetch<any>('/api/calibration')
      if (data.offsets) {
        calibrations.value = data.offsets
      }
    } catch (_) {}
    loading.value = false
  }

  async function adjust(room: string, delta: number) {
    vibrate(15)
    const current = calibrations.value[room] || 0
    const newOffset = current + delta
    calibrations.value[room] = newOffset

    try {
      await $fetch('/api/calibration', {
        method: 'POST',
        body: { room, offset: newOffset },
      })
    } catch (_) {}
  }

  async function snap(room: string, rawRssi: number | null) {
    vibrate(30)
    if (rawRssi === null || !Number.isFinite(rawRssi)) return false
    const target = -60
    const recommendedOffset = target - rawRssi
    const clamped = Math.max(-25, Math.min(25, recommendedOffset))
    calibrations.value[room] = clamped

    try {
      await $fetch('/api/calibration', {
        method: 'POST',
        body: { room, offset: clamped },
      })
      return true
    } catch (_) {
      return false
    }
  }

  return {
    calibrations,
    loading,
    fetchCalibration,
    adjust,
    snap,
  }
}
