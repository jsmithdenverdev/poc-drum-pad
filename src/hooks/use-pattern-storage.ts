import { useState, useEffect, useRef, useCallback } from 'react'
import type { SequencerPattern } from '@/types/audio.types'

const STORAGE_KEY = 'drum-pad-pattern'
const SAVE_DEBOUNCE_MS = 500

// Validate that an object matches the SequencerPattern shape
function isValidPattern(obj: unknown): obj is SequencerPattern {
  if (!obj || typeof obj !== 'object') return false

  const pattern = obj as Partial<SequencerPattern>

  // Check required fields
  if (typeof pattern.id !== 'string') return false
  if (typeof pattern.name !== 'string') return false
  if (typeof pattern.bpm !== 'number') return false
  if (!Array.isArray(pattern.tracks)) return false

  // Validate tracks structure
  return pattern.tracks.every(track => {
    if (!track || typeof track !== 'object') return false
    if (typeof track.soundId !== 'string') return false
    if (track.soundType !== 'drum' && track.soundType !== 'synth') return false
    if (!Array.isArray(track.steps)) return false
    return track.steps.every(step => {
      if (!step || typeof step !== 'object') return false
      return typeof step.active === 'boolean'
    })
  })
}

// Check if localStorage is available
function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

// Load pattern from localStorage
function loadPattern(defaultPattern: SequencerPattern): SequencerPattern {
  if (!isLocalStorageAvailable()) {
    return defaultPattern
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return defaultPattern

    const parsed = JSON.parse(stored)
    if (isValidPattern(parsed)) {
      return parsed
    }

    console.warn('Invalid pattern in localStorage, using default')
    return defaultPattern
  } catch (error) {
    console.error('Failed to load pattern from localStorage:', error)
    return defaultPattern
  }
}

// Save pattern to localStorage
function savePattern(pattern: SequencerPattern): void {
  if (!isLocalStorageAvailable()) {
    return
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pattern))
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded, cannot save pattern')
    } else {
      console.error('Failed to save pattern to localStorage:', error)
    }
  }
}

export function usePatternStorage(defaultPattern: SequencerPattern) {
  const [pattern, setPatternState] = useState<SequencerPattern>(() =>
    loadPattern(defaultPattern)
  )
  const [isLoaded] = useState(true)
  const saveTimeoutRef = useRef<number | null>(null)

  // Debounced save effect
  useEffect(() => {
    // Clear any pending save
    if (saveTimeoutRef.current !== null) {
      window.clearTimeout(saveTimeoutRef.current)
    }

    // Schedule new save
    saveTimeoutRef.current = window.setTimeout(() => {
      savePattern(pattern)
      saveTimeoutRef.current = null
    }, SAVE_DEBOUNCE_MS)

    // Cleanup on unmount
    return () => {
      if (saveTimeoutRef.current !== null) {
        window.clearTimeout(saveTimeoutRef.current)
        // Save immediately on unmount
        savePattern(pattern)
      }
    }
  }, [pattern])

  const setPattern = useCallback((
    updater: SequencerPattern | ((prev: SequencerPattern) => SequencerPattern)
  ) => {
    setPatternState(updater)
  }, [])

  const clearPattern = useCallback(() => {
    setPatternState(defaultPattern)
  }, [defaultPattern])

  return {
    pattern,
    setPattern,
    clearPattern,
    isLoaded,
  }
}
