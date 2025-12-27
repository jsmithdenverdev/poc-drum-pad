import { useState, useEffect, useCallback } from 'react'
import { sequencer } from '@/audio/sequencer'
import type { SequencerPattern, StepCount } from '@/types/audio.types'

export function useSequencer(pattern: SequencerPattern | null) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [bpm, setBpmState] = useState(pattern?.bpm ?? 120)
  const [stepCount, setStepCountState] = useState<StepCount>(16)
  const [hiddenTracks, setHiddenTracks] = useState<Set<string>>(new Set())

  // Keep sequencer in sync with pattern prop
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

  const start = useCallback(async () => {
    const started = await sequencer.start()
    if (started) {
      setIsPlaying(true)
    }
    return started
  }, [])

  const stop = useCallback(() => {
    sequencer.stop()
    setIsPlaying(false)
    setCurrentStep(0)
  }, [])

  const toggle = useCallback(async () => {
    if (isPlaying) {
      stop()
    } else {
      await start()
    }
  }, [isPlaying, start, stop])

  const setBpm = useCallback((newBpm: number) => {
    sequencer.setBpm(newBpm)
    setBpmState(newBpm)
  }, [])

  const setStepCount = useCallback((count: StepCount) => {
    sequencer.setStepCount(count)
    setStepCountState(count)
  }, [])

  const toggleTrackVisibility = useCallback((soundId: string) => {
    setHiddenTracks(prev => {
      const next = new Set(prev)
      if (next.has(soundId)) {
        next.delete(soundId)
      } else {
        next.add(soundId)
      }
      return next
    })
  }, [])

  const isTrackVisible = useCallback((soundId: string) => {
    return !hiddenTracks.has(soundId)
  }, [hiddenTracks])

  return {
    isPlaying,
    currentStep,
    bpm,
    stepCount,
    hiddenTracks,
    start,
    stop,
    toggle,
    setBpm,
    setStepCount,
    toggleTrackVisibility,
    isTrackVisible,
  }
}
