import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { useSequencer } from '@/hooks/use-sequencer'
import { usePatternHistory } from '@/hooks/use-pattern-history'
import { DEFAULT_PATTERN, MAX_STEPS } from '@/constants'
import { PRESET_PATTERNS } from '@/constants/preset-patterns'
import type { SequencerPattern, SoundType, StepCount } from '@/types/audio.types'

interface SequencerContextValue {
  // Pattern state
  pattern: SequencerPattern
  setPattern: (pattern: SequencerPattern) => void

  // Sequencer controls
  isPlaying: boolean
  currentStep: number
  bpm: number
  stepCount: StepCount
  hiddenTracks: Set<string>
  toggle: () => Promise<void>
  setBpm: (bpm: number) => void
  setStepCount: (count: StepCount) => void
  toggleTrackVisibility: (soundId: string) => void

  // UI state
  showSequencer: boolean
  setShowSequencer: (show: boolean) => void
  selectedStep: number | null
  setSelectedStep: (step: number | null) => void
  showSettings: boolean
  setShowSettings: (show: boolean) => void

  // Pattern manipulation
  toggleSoundOnStep: (soundId: string, stepIndex: number, soundType: SoundType) => void
  clearPattern: () => void
  handleStepSelect: (stepIndex: number) => void
  handleStepCountChange: (newCount: StepCount) => void
  loadPattern: (patternId: string) => void

  // Undo/Redo
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
}

const SequencerContext = createContext<SequencerContextValue | undefined>(undefined)

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
function loadPatternFromStorage(defaultPattern: SequencerPattern): SequencerPattern {
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

export function SequencerProvider({ children }: { children: ReactNode }) {
  // Load initial pattern from localStorage
  const initialPattern = loadPatternFromStorage(DEFAULT_PATTERN)
  const { pattern, setPattern, undo, redo, canUndo, canRedo } = usePatternHistory(initialPattern)
  const [showSequencer, setShowSequencer] = useState(false)
  const [selectedStep, setSelectedStep] = useState<number | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const saveTimeoutRef = useRef<number | null>(null)

  // Debounced save effect for localStorage persistence
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

  const {
    isPlaying,
    currentStep,
    bpm,
    stepCount,
    hiddenTracks,
    toggle,
    setBpm,
    setStepCount,
    toggleTrackVisibility,
  } = useSequencer(pattern)

  // Handle step selection
  const handleStepSelect = useCallback((stepIndex: number) => {
    setSelectedStep(prev => prev === stepIndex ? null : stepIndex)
  }, [])

  // Toggle sound on step (with sound type)
  const toggleSoundOnStep = useCallback((soundId: string, stepIndex: number, soundType: SoundType) => {
    setPattern(prev => {
      const trackIndex = prev.tracks.findIndex(t => t.soundId === soundId)

      if (trackIndex >= 0) {
        return {
          ...prev,
          tracks: prev.tracks.map((track, idx) => {
            if (idx !== trackIndex) return track
            return {
              ...track,
              steps: track.steps.map((step, sIdx) => {
                if (sIdx !== stepIndex) return step
                return { ...step, active: !step.active }
              }),
            }
          }),
        }
      } else {
        const newTrack = {
          soundId,
          soundType,
          steps: Array(MAX_STEPS).fill(null).map((_, sIdx) => ({
            active: sIdx === stepIndex
          })),
        }
        return {
          ...prev,
          tracks: [...prev.tracks, newTrack],
        }
      }
    })
  }, [setPattern])

  // Handle step count change - only changes display/playback, data always has MAX_STEPS
  const handleStepCountChange = useCallback((newCount: StepCount) => {
    setStepCount(newCount)
    // Ensure all tracks have MAX_STEPS (in case of legacy data)
    setPattern(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => {
        if (track.steps.length >= MAX_STEPS) return track
        // Extend to MAX_STEPS if needed
        const newSteps = Array(MAX_STEPS - track.steps.length).fill(null).map(() => ({ active: false }))
        return { ...track, steps: [...track.steps, ...newSteps] }
      }),
    }))
    // Clear selected step if it's beyond new count
    if (selectedStep !== null && selectedStep >= newCount) {
      setSelectedStep(null)
    }
  }, [setStepCount, selectedStep, setPattern])

  // Clear all tracks
  const clearPattern = useCallback(() => {
    setPattern(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        steps: track.steps.map(() => ({ active: false })),
      })),
    }))
  }, [setPattern])

  // Load a preset pattern
  const loadPattern = useCallback((patternId: string) => {
    const preset = PRESET_PATTERNS.find(p => p.id === patternId)
    if (!preset) return

    // Set the pattern with the preset data
    setPattern({
      ...preset,
      // Keep the current pattern id to preserve localStorage key
      id: pattern.id,
    })
    // Update BPM to match the preset
    setBpm(preset.bpm)
  }, [pattern.id, setBpm, setPattern])

  return (
    <SequencerContext.Provider
      value={{
        pattern,
        setPattern,
        isPlaying,
        currentStep,
        bpm,
        stepCount,
        hiddenTracks,
        toggle,
        setBpm,
        setStepCount,
        toggleTrackVisibility,
        showSequencer,
        setShowSequencer,
        selectedStep,
        setSelectedStep,
        showSettings,
        setShowSettings,
        toggleSoundOnStep,
        clearPattern,
        handleStepSelect,
        handleStepCountChange,
        loadPattern,
        undo,
        redo,
        canUndo,
        canRedo,
      }}
    >
      {children}
    </SequencerContext.Provider>
  )
}

export function useSequencerContext() {
  const context = useContext(SequencerContext)
  if (!context) {
    throw new Error('useSequencerContext must be used within SequencerProvider')
  }
  return context
}
