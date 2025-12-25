import { useState, useEffect, useCallback } from 'react'
import { sequencer } from '@/audio/sequencer'
import type { SequencerPattern } from '@/types/audio.types'

export function useSequencer(pattern: SequencerPattern | null) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [bpm, setBpmState] = useState(pattern?.bpm ?? 120)

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

  return {
    isPlaying,
    currentStep,
    bpm,
    start,
    stop,
    toggle,
    setBpm,
  }
}
