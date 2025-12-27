import { useState, useEffect, useCallback, useRef } from 'react'
import { audioEngine } from '@/audio/audio-engine'
import type { DrumSound, AudioEngineState } from '@/types/audio.types'

export function useAudioEngine(sounds: DrumSound[]) {
  const [state, setState] = useState<AudioEngineState>(audioEngine.state)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isSuspended, setIsSuspended] = useState(false)
  const needsResumeOnInteraction = useRef(false)

  useEffect(() => {
    return audioEngine.onStateChange(setState)
  }, [])

  // Track visibility changes and set up resume-on-interaction
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && audioEngine.isSuspended) {
        console.log('Page visible with suspended audio - will resume on next interaction')
        needsResumeOnInteraction.current = true
        setIsSuspended(true)
      }
    }

    // Resume audio on any user interaction if needed
    const handleInteraction = async () => {
      if (needsResumeOnInteraction.current && audioEngine.isSuspended) {
        console.log('User interaction detected - resuming audio...')
        needsResumeOnInteraction.current = false
        const resumed = await audioEngine.resume()
        if (resumed) {
          console.log('Audio resumed successfully')
          setIsSuspended(false)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    // Use capture phase to ensure we get the event before it's handled
    document.addEventListener('touchstart', handleInteraction, { capture: true })
    document.addEventListener('mousedown', handleInteraction, { capture: true })
    document.addEventListener('keydown', handleInteraction, { capture: true })

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('touchstart', handleInteraction, { capture: true })
      document.removeEventListener('mousedown', handleInteraction, { capture: true })
      document.removeEventListener('keydown', handleInteraction, { capture: true })
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

  const playSynth = useCallback(async (noteId: string) => {
    await audioEngine.playSynth(noteId)
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
    playSynth,
    resume,
    setVolume,
    playTestTone,
    isReady: state === 'ready',
    isLoading: state === 'loading',
    needsInit: state === 'uninitialized',
  }
}
