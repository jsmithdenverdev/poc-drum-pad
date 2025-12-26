import { useState, useEffect, useCallback } from 'react'
import { audioEngine } from '@/audio/audio-engine'
import type { DrumSound, AudioEngineState } from '@/types/audio.types'

export function useAudioEngine(sounds: DrumSound[]) {
  const [state, setState] = useState<AudioEngineState>(audioEngine.state)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isSuspended, setIsSuspended] = useState(false)

  useEffect(() => {
    return audioEngine.onStateChange(setState)
  }, [])

  // Track visibility changes to detect when app is backgrounded/foregrounded
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Check if audio context got suspended while hidden
        setIsSuspended(audioEngine.isSuspended)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const init = useCallback(async () => {
    if (isInitialized) return
    await audioEngine.init(sounds)
    setIsInitialized(true)
    setIsSuspended(false)
  }, [sounds, isInitialized])

  const play = useCallback(async (soundId: string) => {
    await audioEngine.play(soundId)
    // After playing, we're no longer suspended
    setIsSuspended(false)
  }, [])

  const resume = useCallback(async () => {
    const wasResumed = await audioEngine.resume()
    if (wasResumed) {
      setIsSuspended(false)
    }
    return wasResumed
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
    init,
    play,
    resume,
    setVolume,
    playTestTone,
    isReady: state === 'ready',
    isLoading: state === 'loading',
    needsInit: state === 'uninitialized',
  }
}
