import { describe, it, expect, beforeEach, vi } from 'vitest'
import { audioEngine } from '../audio-engine'
import { audioContextManager } from '../audio-context-manager'
import { synthEngine } from '../synth-engine'
import type { DrumSound } from '@/types/audio.types'

describe('AudioEngine', () => {
  const mockSounds: DrumSound[] = [
    { id: 'kick', name: 'Kick', url: '/sounds/kick.wav', color: '#ff0000' },
    { id: 'snare', name: 'Snare', url: '/sounds/snare.wav', color: '#00ff00' },
  ]

  beforeEach(() => {
    // Clean up before each test
    audioEngine.dispose()
    audioContextManager.dispose()
    vi.clearAllMocks()

    // Mock fetch to return fake audio data
    ;(globalThis as Record<string, unknown>).fetch = vi.fn().mockImplementation((_url: string) => {
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: {
          get: (name: string) => (name === 'content-type' ? 'audio/wav' : null),
        },
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
      })
    })
  })

  describe('init()', () => {
    it('should create context and load sounds', async () => {
      await audioEngine.init(mockSounds)

      expect(audioEngine.state).toBe('ready')
      expect(audioContextManager.getContext()).toBeDefined()
      expect(globalThis.fetch).toHaveBeenCalledTimes(2)
      expect(globalThis.fetch).toHaveBeenCalledWith('/sounds/kick.wav')
      expect(globalThis.fetch).toHaveBeenCalledWith('/sounds/snare.wav')
    })

    it('should set up synth engine with context', async () => {
      const setContextSpy = vi.spyOn(synthEngine, 'setContext')

      await audioEngine.init(mockSounds)

      expect(setContextSpy).toHaveBeenCalled()
    })

    it('should handle loading state', async () => {
      const states: string[] = []
      audioEngine.onStateChange((state) => states.push(state))

      await audioEngine.init(mockSounds)

      expect(states).toContain('loading')
      expect(states).toContain('ready')
    })

    it('should resume existing context instead of recreating', async () => {
      // First init
      await audioEngine.init(mockSounds)
      const context1 = audioContextManager.getContext()

      // Second init
      await audioEngine.init(mockSounds)
      const context2 = audioContextManager.getContext()

      expect(context1).toBe(context2)
    })

    it('should set state to error on failure', async () => {
      // Mock createContext to throw an error
      const originalCreateContext = audioContextManager.createContext
      audioContextManager.createContext = vi.fn().mockImplementation(() => {
        throw new Error('Failed to create AudioContext')
      })

      await expect(audioEngine.init(mockSounds)).rejects.toThrow('Failed to create AudioContext')
      expect(audioEngine.state).toBe('error')

      // Restore original method
      audioContextManager.createContext = originalCreateContext
    })

    it('should handle fetch failures gracefully for individual sounds', async () => {
      ;(globalThis as Record<string, unknown>).fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('kick')) {
          return Promise.reject(new Error('Not found'))
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: {
            get: (name: string) => (name === 'content-type' ? 'audio/wav' : null),
          },
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
        })
      })

      await audioEngine.init(mockSounds)

      // Should still reach ready state even if one sound fails
      expect(audioEngine.state).toBe('ready')
    })

    it('should skip non-audio content types', async () => {
      ;(globalThis as Record<string, unknown>).fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: {
          get: (name: string) => (name === 'content-type' ? 'text/html' : null),
        },
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
      })

      await audioEngine.init(mockSounds)

      expect(audioEngine.state).toBe('ready')
    })
  })

  describe('play()', () => {
    it('should trigger sound playback', async () => {
      await audioEngine.init(mockSounds)
      const context = audioContextManager.getContext()
      const createBufferSourceSpy = vi.spyOn(context!, 'createBufferSource')

      await audioEngine.play('kick')

      expect(createBufferSourceSpy).toHaveBeenCalled()
    })

    it('should resume suspended context before playing', async () => {
      await audioEngine.init(mockSounds)
      const context = audioContextManager.getContext()!
      const resumeSpy = vi.spyOn(context, 'resume')

      // @ts-ignore - Set state to suspended
      context.state = 'suspended'

      await audioEngine.play('kick')

      expect(resumeSpy).toHaveBeenCalled()
    })

    it('should warn when engine is not initialized', async () => {
      const consoleSpy = vi.spyOn(console, 'warn')

      await audioEngine.play('kick')

      expect(consoleSpy).toHaveBeenCalledWith('Audio engine not initialized')
    })

    it('should warn when sound is not found', async () => {
      await audioEngine.init(mockSounds)
      const consoleSpy = vi.spyOn(console, 'warn')

      await audioEngine.play('nonexistent')

      expect(consoleSpy).toHaveBeenCalledWith('Sound not found: nonexistent')
    })

    it('should handle playback errors gracefully', async () => {
      await audioEngine.init(mockSounds)
      const context = audioContextManager.getContext()!

      // Make createBufferSource throw an error
      vi.spyOn(context, 'createBufferSource').mockImplementation(() => {
        throw new Error('Playback error')
      })

      const consoleSpy = vi.spyOn(console, 'error')

      await audioEngine.play('kick')

      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  describe('playSynth()', () => {
    it('should delegate to synth engine', async () => {
      await audioEngine.init(mockSounds)
      const playNoteSpy = vi.spyOn(synthEngine, 'playNote')

      await audioEngine.playSynth('synth-C4')

      expect(playNoteSpy).toHaveBeenCalledWith('synth-C4')
    })

    it('should resume suspended context before playing synth', async () => {
      await audioEngine.init(mockSounds)
      const context = audioContextManager.getContext()!
      const resumeSpy = vi.spyOn(context, 'resume')

      // @ts-ignore - Set state to suspended
      context.state = 'suspended'

      await audioEngine.playSynth('synth-C4')

      expect(resumeSpy).toHaveBeenCalled()
    })

    it('should warn when engine is not initialized', async () => {
      const consoleSpy = vi.spyOn(console, 'warn')

      await audioEngine.playSynth('synth-C4')

      expect(consoleSpy).toHaveBeenCalledWith('Audio engine not initialized')
    })
  })

  describe('schedulePlay()', () => {
    it('should schedule drum sound at specific time', async () => {
      await audioEngine.init(mockSounds)
      const context = audioContextManager.getContext()!
      const createBufferSourceSpy = vi.spyOn(context, 'createBufferSource')

      audioEngine.schedulePlay('kick', 1.0, false)

      expect(createBufferSourceSpy).toHaveBeenCalled()
    })

    it('should delegate to synth engine for synth sounds', async () => {
      await audioEngine.init(mockSounds)
      const scheduleNoteSpy = vi.spyOn(synthEngine, 'scheduleNote')

      audioEngine.schedulePlay('synth-C4', 1.0, true)

      expect(scheduleNoteSpy).toHaveBeenCalledWith('synth-C4', 1.0)
    })

    it('should not schedule when context is suspended', async () => {
      await audioEngine.init(mockSounds)
      const context = audioContextManager.getContext()!
      const createBufferSourceSpy = vi.spyOn(context, 'createBufferSource')

      // @ts-ignore - Set state to suspended
      context.state = 'suspended'

      audioEngine.schedulePlay('kick', 1.0, false)

      expect(createBufferSourceSpy).not.toHaveBeenCalled()
    })
  })

  describe('volume control', () => {
    it('should set volume', async () => {
      await audioEngine.init(mockSounds)

      audioEngine.setVolume(0.5)

      expect(audioEngine.getVolume()).toBe(0.5)
    })

    it('should clamp volume to 0-1 range', async () => {
      await audioEngine.init(mockSounds)

      audioEngine.setVolume(1.5)
      expect(audioEngine.getVolume()).toBe(1)

      audioEngine.setVolume(-0.5)
      expect(audioEngine.getVolume()).toBe(0)
    })

    it('should return default volume when not initialized', () => {
      expect(audioEngine.getVolume()).toBe(1)
    })
  })

  describe('state management', () => {
    it('should notify listeners on state change', async () => {
      const listener = vi.fn()
      audioEngine.onStateChange(listener)

      await audioEngine.init(mockSounds)

      expect(listener).toHaveBeenCalledWith('loading')
      expect(listener).toHaveBeenCalledWith('ready')
    })

    it('should remove listener when cleanup function is called', async () => {
      const listener = vi.fn()
      const cleanup = audioEngine.onStateChange(listener)

      cleanup()

      await audioEngine.init(mockSounds)

      expect(listener).not.toHaveBeenCalled()
    })

    it('should report correct state', async () => {
      expect(audioEngine.state).toBe('uninitialized')

      const initPromise = audioEngine.init(mockSounds)
      // State should be loading during init
      // Note: this might be racy, but loading should happen immediately
      await initPromise

      expect(audioEngine.state).toBe('ready')
    })
  })

  describe('context state getters', () => {
    it('should report isSuspended correctly', async () => {
      await audioEngine.init(mockSounds)
      expect(audioEngine.isSuspended).toBe(false)

      const context = audioContextManager.getContext()!
      // @ts-ignore
      context.state = 'suspended'
      expect(audioEngine.isSuspended).toBe(true)
    })

    it('should report isRunning correctly', async () => {
      await audioEngine.init(mockSounds)
      expect(audioEngine.isRunning).toBe(true)
    })

    it('should get current time', async () => {
      await audioEngine.init(mockSounds)
      const time = audioEngine.getCurrentTime()
      expect(typeof time).toBe('number')
      expect(time).toBeGreaterThanOrEqual(0)
    })
  })

  describe('resume()', () => {
    it('should delegate to audioContextManager', async () => {
      await audioEngine.init(mockSounds)
      const ensureRunningSpy = vi.spyOn(audioContextManager, 'ensureRunning')

      await audioEngine.resume()

      expect(ensureRunningSpy).toHaveBeenCalled()
    })
  })

  describe('playTestTone()', () => {
    it('should create and play an oscillator', async () => {
      await audioEngine.init(mockSounds)
      const context = audioContextManager.getContext()!
      const createOscillatorSpy = vi.spyOn(context, 'createOscillator')

      audioEngine.playTestTone()

      expect(createOscillatorSpy).toHaveBeenCalled()
    })

    it('should warn when not initialized', () => {
      const consoleSpy = vi.spyOn(console, 'warn')

      audioEngine.playTestTone()

      expect(consoleSpy).toHaveBeenCalledWith('Cannot play test tone - not initialized')
    })
  })

  describe('dispose()', () => {
    it('should clean up all resources', async () => {
      await audioEngine.init(mockSounds)

      audioEngine.dispose()

      expect(audioEngine.state).toBe('uninitialized')
      expect(audioContextManager.getContext()).toBeNull()
    })
  })
})
