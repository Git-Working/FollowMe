import { ref } from 'vue'
import { useHaptics } from './useHaptics'

export interface PathLightingConfig {
  enabled: boolean
  hallwayRoom: string
  durationSec: number
}

export function useSettings() {
  const { vibrate } = useHaptics()
  const pathLighting = ref<PathLightingConfig>({
    enabled: false,
    hallwayRoom: '',
    durationSec: 30,
  })
  const isSaving = ref(false)

  async function fetchSettings() {
    try {
      const data = await $fetch<any>('/api/settings')
      if (data.pathLighting) {
        pathLighting.value = data.pathLighting
      }
    } catch (_) {}
  }

  async function savePathLighting(cfg: PathLightingConfig) {
    vibrate(25)
    isSaving.value = true
    try {
      const data = await $fetch<any>('/api/settings', {
        method: 'POST',
        body: { pathLighting: cfg },
      })
      if (data.pathLighting) {
        pathLighting.value = data.pathLighting
      }
      isSaving.value = false
      return true
    } catch (_) {
      isSaving.value = false
      return false
    }
  }

  return {
    pathLighting,
    isSaving,
    fetchSettings,
    savePathLighting,
  }
}
