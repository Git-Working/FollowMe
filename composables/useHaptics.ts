export function useHaptics() {
  function vibrate(ms = 15) {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms)
      } catch (_) {}
    }
  }

  return {
    vibrate,
  }
}
