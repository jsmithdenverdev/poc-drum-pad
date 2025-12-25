import { useState, useEffect, useCallback } from 'react'
import { audioEngine } from '@/audio/audio-engine'
import type { DrumSound, AudioEngineState } from '@/types/audio.types'

export function useAudioEngine(sounds: DrumSound[]) {
  const [state, setState] = useState<AudioEngineState>(audioEngine.state)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    return audioEngine.onStateChange(setState)
  }, [])

  const init = useCallback(async () => {
    if (isInitialized) return
    await audioEngine.init(sounds)
    setIsInitialized(true)
  }, [sounds, isInitialized])

  const play = useCallback((soundId: string) => {
    audioEngine.play(soundId)
  }, [])

  const setVolume = useCallback((volume: number) => {
    audioEngine.setVolume(volume)
  }, [])

  return {
    state,
    isInitialized,
    init,
    play,
    setVolume,
    isReady: state === 'ready',
    isLoading: state === 'loading',
    needsInit: state === 'uninitialized',
  }
}
