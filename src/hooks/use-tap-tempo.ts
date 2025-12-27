import { useCallback, useRef } from 'react'

export function useTapTempo(onBpmChange: (bpm: number) => void) {
  const taps = useRef<number[]>([])
  const timeoutRef = useRef<number | null>(null)

  const tap = useCallback(() => {
    const now = Date.now()
    taps.current.push(now)

    // Keep last 4 taps
    if (taps.current.length > 4) {
      taps.current.shift()
    }

    // Calculate BPM from intervals
    if (taps.current.length >= 2) {
      const intervals: number[] = []
      for (let i = 1; i < taps.current.length; i++) {
        intervals.push(taps.current[i] - taps.current[i-1])
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
      const bpm = Math.round(60000 / avgInterval)
      onBpmChange(Math.max(60, Math.min(200, bpm)))  // Clamp to valid range
    }

    // Reset after 2 seconds of no taps
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      taps.current = []
    }, 2000)
  }, [onBpmChange])

  return { tap }
}
