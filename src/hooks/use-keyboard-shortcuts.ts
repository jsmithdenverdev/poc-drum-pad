import { useEffect, useRef } from 'react'
import { DRUM_SOUNDS } from '@/constants'

interface UseKeyboardShortcutsOptions {
  onTrigger: (soundId: string) => void
  onUndo?: () => void
  onRedo?: () => void
  enabled?: boolean
}

export function useKeyboardShortcuts({ onTrigger, onUndo, onRedo, enabled = true }: UseKeyboardShortcutsOptions) {
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

      // Handle undo/redo shortcuts
      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        // Ctrl+Shift+Z or Cmd+Shift+Z for redo
        if (e.shiftKey && e.key.toLowerCase() === 'z') {
          e.preventDefault()
          onRedo?.()
          return
        }
        // Ctrl+Y or Cmd+Y for redo (alternative)
        if (e.key.toLowerCase() === 'y') {
          e.preventDefault()
          onRedo?.()
          return
        }
        // Ctrl+Z or Cmd+Z for undo
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault()
          onUndo?.()
          return
        }
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
  }, [onTrigger, onUndo, onRedo, enabled])
}
