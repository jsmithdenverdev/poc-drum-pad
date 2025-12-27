import { useState, useEffect, useCallback } from 'react'
import { audioEngine } from '@/audio/audio-engine'
import { audioContextManager } from '@/audio/audio-context-manager'
import type { DrumSound, AudioEngineState } from '@/types/audio.types'

export function useAudioEngine(sounds: DrumSound[]) {
  const [state, setState] = useState<AudioEngineState>(audioEngine.state)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isSuspended, setIsSuspended] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Listen to audio engine state changes
  useEffect(() => {
    return audioEngine.onStateChange(setState)
  }, [])

  // Listen to audio context state changes
  useEffect(() => {
    return audioContextManager.onStateChange((contextState) => {
      setIsSuspended(contextState === 'suspended')
    })
  }, [])

  const init = useCallback(async () => {
    if (isInitialized) return
    try {
      setError(null)
      await audioEngine.init(sounds)
      setIsInitialized(true)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      throw error
    }
  }, [sounds, isInitialized])

  const play = useCallback(async (soundId: string) => {
    await audioEngine.play(soundId)
  }, [])

  const playSynth = useCallback(async (noteId: string) => {
    await audioEngine.playSynth(noteId)
  }, [])

  const resume = useCallback(async () => {
    return await audioEngine.resume()
  }, [])

  const setVolume = useCallback((volume: number) => {
    audioEngine.setVolume(volume)
  }, [])

  const playTestTone = useCallback(() => {
    audioEngine.playTestTone()
  }, [])

  return {
    state,
    isInitialized,
    isSuspended,
    error,
    init,
    play,
    playSynth,
    resume,
    setVolume,
    playTestTone,
    isReady: state === 'ready',
    isLoading: state === 'loading',
    needsInit: state === 'uninitialized',
    hasError: state === 'error',
  }
}
