import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { useSequencer } from '@/hooks/use-sequencer'
import { usePatternStorage } from '@/hooks/use-pattern-storage'
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
}

const SequencerContext = createContext<SequencerContextValue | undefined>(undefined)

export function SequencerProvider({ children }: { children: ReactNode }) {
  const { pattern, setPattern } = usePatternStorage(DEFAULT_PATTERN)
  const [showSequencer, setShowSequencer] = useState(false)
  const [selectedStep, setSelectedStep] = useState<number | null>(null)
  const [showSettings, setShowSettings] = useState(false)

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
  }, [])

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
  }, [setStepCount, selectedStep])

  // Clear all tracks
  const clearPattern = useCallback(() => {
    setPattern(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        steps: track.steps.map(() => ({ active: false })),
      })),
    }))
  }, [])

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
  }, [pattern.id, setBpm])

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
