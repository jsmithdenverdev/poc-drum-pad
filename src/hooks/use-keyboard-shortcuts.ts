import { useEffect, useRef } from 'react'
import { DRUM_SOUNDS } from '@/constants'

interface UseKeyboardShortcutsOptions {
  onTrigger: (soundId: string) => void
  enabled?: boolean
}

export function useKeyboardShortcuts({ onTrigger, enabled = true }: UseKeyboardShortcutsOptions) {
  // Track last trigger time per key to debounce key repeat
  const lastTriggerRef = useRef<Map<string, number>>(new Map())
  const DEBOUNCE_MS = 50  // Prevent rapid key repeat

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      const key = e.key.toLowerCase()
      const sound = DRUM_SOUNDS.find(s => s.key === key)

      if (sound) {
        const now = Date.now()
        const lastTrigger = lastTriggerRef.current.get(key) || 0

        if (now - lastTrigger > DEBOUNCE_MS) {
          e.preventDefault()
          lastTriggerRef.current.set(key, now)
          onTrigger(sound.id)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onTrigger, enabled])
}
