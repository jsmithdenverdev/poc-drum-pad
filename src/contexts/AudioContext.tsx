import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { useAudioEngine } from '@/hooks/use-audio-engine'
import { DRUM_SOUNDS } from '@/constants'
import { synthEngine, DEFAULT_SYNTH_SETTINGS, type SynthSettings, type WaveformType } from '@/audio/synth-engine'

interface AudioContextValue {
  // Audio engine state
  init: () => Promise<void>
  play: (soundId: string) => Promise<void>
  playSynth: (noteId: string) => Promise<void>
  needsInit: boolean
  isLoading: boolean
  hasError: boolean
  error: Error | null

  // Synth settings
  synthSettings: SynthSettings
  handleWaveformChange: (waveform: WaveformType) => void
  handleOctaveChange: (octave: number) => void
  handleDetuneChange: (detune: number) => void
  handleAttackChange: (attack: number) => void
  handleReleaseChange: (release: number) => void
  handleFilterChange: (filterCutoff: number) => void
}

const AudioContext = createContext<AudioContextValue | undefined>(undefined)

export function AudioProvider({ children }: { children: ReactNode }) {
  const { init, play, playSynth, needsInit, isLoading, hasError, error } = useAudioEngine(DRUM_SOUNDS)
  const [synthSettings, setSynthSettings] = useState<SynthSettings>(DEFAULT_SYNTH_SETTINGS)

  const handleWaveformChange = useCallback((waveform: WaveformType) => {
    synthEngine.setWaveform(waveform)
    setSynthSettings(prev => ({ ...prev, waveform }))
  }, [])

  const handleOctaveChange = useCallback((octave: number) => {
    synthEngine.setOctave(octave)
    setSynthSettings(prev => ({ ...prev, octave }))
  }, [])

  const handleDetuneChange = useCallback((detune: number) => {
    synthEngine.setDetune(detune)
    setSynthSettings(prev => ({ ...prev, detune }))
  }, [])

  const handleAttackChange = useCallback((attack: number) => {
    synthEngine.setAttack(attack)
    setSynthSettings(prev => ({ ...prev, attack }))
  }, [])

  const handleReleaseChange = useCallback((release: number) => {
    synthEngine.setRelease(release)
    setSynthSettings(prev => ({ ...prev, release }))
  }, [])

  const handleFilterChange = useCallback((filterCutoff: number) => {
    synthEngine.setFilterCutoff(filterCutoff)
    setSynthSettings(prev => ({ ...prev, filterCutoff }))
  }, [])

  return (
    <AudioContext.Provider
      value={{
        init,
        play,
        playSynth,
        needsInit,
        isLoading,
        hasError,
        error,
        synthSettings,
        handleWaveformChange,
        handleOctaveChange,
        handleDetuneChange,
        handleAttackChange,
        handleReleaseChange,
        handleFilterChange,
      }}
    >
      {children}
    </AudioContext.Provider>
  )
}

export function useAudio() {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider')
  }
  return context
}
