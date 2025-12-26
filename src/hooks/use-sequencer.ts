import { useState, useEffect, useCallback } from 'react'
import { sequencer } from '@/audio/sequencer'
import type { SequencerPattern } from '@/types/audio.types'

export function useSequencer(initialPattern: SequencerPattern | null) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [bpm, setBpmState] = useState(initialPattern?.bpm ?? 120)
  const [pattern, setPattern] = useState<SequencerPattern | null>(initialPattern)

  useEffect(() => {
    if (pattern) {
      sequencer.setPattern(pattern)
    }
  }, [pattern])

  useEffect(() => {
    return sequencer.onStep((step) => {
      setCurrentStep(step)
    })
  }, [])

  // Listen for external stop events (e.g., page hidden)
  useEffect(() => {
    return sequencer.onStop(() => {
      setIsPlaying(false)
      setCurrentStep(0)
    })
  }, [])

  const start = useCallback(() => {
    sequencer.start()
    setIsPlaying(true)
  }, [])

  const stop = useCallback(() => {
    sequencer.stop()
    setIsPlaying(false)
    setCurrentStep(0)
  }, [])

  const toggle = useCallback(() => {
    if (isPlaying) {
      stop()
    } else {
      start()
    }
  }, [isPlaying, start, stop])

  const setBpm = useCallback((newBpm: number) => {
    sequencer.setBpm(newBpm)
    setBpmState(newBpm)
  }, [])

  const toggleStep = useCallback((trackIndex: number, stepIndex: number) => {
    setPattern(prev => {
      if (!prev) return prev

      const newPattern = {
        ...prev,
        tracks: prev.tracks.map((track, tIdx) => {
          if (tIdx !== trackIndex) return track
          return {
            ...track,
            steps: track.steps.map((step, sIdx) => {
              if (sIdx !== stepIndex) return step
              return { ...step, active: !step.active }
            }),
          }
        }),
      }

      // Update the sequencer with the new pattern
      sequencer.setPattern(newPattern)
      return newPattern
    })
  }, [])

  const toggleSoundOnStep = useCallback((soundId: string, stepIndex: number) => {
    setPattern(prev => {
      if (!prev) return prev

      const newPattern = {
        ...prev,
        tracks: prev.tracks.map(track => {
          if (track.soundId !== soundId) return track
          return {
            ...track,
            steps: track.steps.map((step, sIdx) => {
              if (sIdx !== stepIndex) return step
              return { ...step, active: !step.active }
            }),
          }
        }),
      }

      sequencer.setPattern(newPattern)
      return newPattern
    })
  }, [])

  const clearPattern = useCallback(() => {
    setPattern(prev => {
      if (!prev) return prev

      const newPattern = {
        ...prev,
        tracks: prev.tracks.map(track => ({
          ...track,
          steps: track.steps.map(() => ({ active: false })),
        })),
      }

      sequencer.setPattern(newPattern)
      return newPattern
    })
  }, [])

  return {
    isPlaying,
    currentStep,
    bpm,
    pattern,
    start,
    stop,
    toggle,
    setBpm,
    toggleStep,
    toggleSoundOnStep,
    clearPattern,
  }
}
