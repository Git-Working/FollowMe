import { ref } from 'vue'

export function useWakeLock() {
  const isLocked = ref(false)
  let sentinel: any = null

  async function request() {
    if (typeof window !== 'undefined' && 'wakeLock' in navigator) {
      try {
        sentinel = await (navigator as any).wakeLock.request('screen')
        isLocked.value = true
        sentinel.addEventListener('release', () => {
          isLocked.value = false
          sentinel = null
        })
      } catch (err: any) {
        console.warn('WakeLock not granted:', err.message)
      }
    }
  }

  function release() {
    if (sentinel) {
      sentinel.release().catch(() => {})
      sentinel = null
      isLocked.value = false
    }
  }

  return {
    isLocked,
    request,
    release,
  }
}
