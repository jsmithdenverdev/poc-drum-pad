import { describe, it, expect, beforeEach, vi } from 'vitest'
import { audioContextManager } from '../audio-context-manager'

describe('AudioContextManager', () => {
  beforeEach(() => {
    // Clean up any existing context before each test
    audioContextManager.dispose()
  })

  describe('createContext()', () => {
    it('should create a new AudioContext', () => {
      const context = audioContextManager.createContext()
      expect(context).toBeDefined()
      expect(context.state).toBe('running')
    })

    it('should return the same context on subsequent calls', () => {
      const context1 = audioContextManager.createContext()
      const context2 = audioContextManager.createContext()
      expect(context1).toBe(context2)
    })

    it('should set up state change listener', () => {
      const context = audioContextManager.createContext()
      expect(context.onstatechange).toBeDefined()
    })
  })

  describe('ensureRunning()', () => {
    it('should return true when context is already running', async () => {
      audioContextManager.createContext()
      const result = await audioContextManager.ensureRunning()
      expect(result).toBe(true)
    })

    it('should return false when context is not created', async () => {
      const result = await audioContextManager.ensureRunning()
      expect(result).toBe(false)
    })

    it('should resume a suspended context', async () => {
      const context = audioContextManager.createContext()
      // @ts-expect-error - Manually set state to suspended for testing
      context.state = 'suspended'

      const result = await audioContextManager.ensureRunning()
      expect(result).toBe(true)
      expect(context.state).toBe('running')
    })

    it('should deduplicate concurrent resume calls', async () => {
      const context = audioContextManager.createContext()
      const resumeSpy = vi.spyOn(context, 'resume')
      // @ts-expect-error - Manually set state to suspended for testing
      context.state = 'suspended'

      // Make multiple concurrent calls
      const [result1, result2, result3] = await Promise.all([
        audioContextManager.ensureRunning(),
        audioContextManager.ensureRunning(),
        audioContextManager.ensureRunning(),
      ])

      expect(result1).toBe(true)
      expect(result2).toBe(true)
      expect(result3).toBe(true)
      // resume() should only be called once despite multiple concurrent calls
      expect(resumeSpy).toHaveBeenCalledTimes(1)
    })

    it('should return false when context is closed', async () => {
      const context = audioContextManager.createContext()
      // @ts-expect-error - Manually set state to closed for testing
      context.state = 'closed'

      const result = await audioContextManager.ensureRunning()
      expect(result).toBe(false)
    })
  })

  describe('state getters', () => {
    it('should correctly report isSuspended', () => {
      const context = audioContextManager.createContext()
      expect(audioContextManager.isSuspended).toBe(false)

      // @ts-expect-error - Manually set state for testing
      context.state = 'suspended'
      expect(audioContextManager.isSuspended).toBe(true)
    })

    it('should correctly report isRunning', () => {
      audioContextManager.createContext()
      expect(audioContextManager.isRunning).toBe(true)
    })

    it('should return currentTime', () => {
      const context = audioContextManager.createContext()
      expect(audioContextManager.currentTime).toBe(context.currentTime)
    })

    it('should return state', () => {
      const context = audioContextManager.createContext()
      expect(audioContextManager.state).toBe(context.state)
    })
  })

  describe('onStateChange()', () => {
    it('should call listener when state changes', () => {
      const listener = vi.fn()
      audioContextManager.onStateChange(listener)

      const context = audioContextManager.createContext()

      // Trigger state change (cast to bypass mock type mismatch)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(context.onstatechange as any)?.()

      expect(listener).toHaveBeenCalledWith('running')
    })

    it('should support multiple listeners', () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      audioContextManager.onStateChange(listener1)
      audioContextManager.onStateChange(listener2)

      const context = audioContextManager.createContext()

      // Trigger state change
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(context.onstatechange as any)?.()

      expect(listener1).toHaveBeenCalled()
      expect(listener2).toHaveBeenCalled()
    })

    it('should remove listener when cleanup function is called', () => {
      const listener = vi.fn()
      const cleanup = audioContextManager.onStateChange(listener)

      cleanup()

      const context = audioContextManager.createContext()

      // Trigger state change
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(context.onstatechange as any)?.()

      expect(listener).not.toHaveBeenCalled()
    })
  })

  describe('dispose()', () => {
    it('should close the context and clear resources', () => {
      const context = audioContextManager.createContext()
      const closeSpy = vi.spyOn(context, 'close')

      audioContextManager.dispose()

      expect(closeSpy).toHaveBeenCalled()
      expect(audioContextManager.getContext()).toBeNull()
      expect(audioContextManager.state).toBeNull()
    })

    it('should clear all state listeners', () => {
      const listener = vi.fn()
      audioContextManager.onStateChange(listener)

      audioContextManager.createContext()
      audioContextManager.dispose()

      // Create a new context and trigger state change
      const newContext = audioContextManager.createContext()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(newContext.onstatechange as any)?.()

      // Old listener should not be called
      expect(listener).not.toHaveBeenCalled()
    })
  })

  describe('getContext()', () => {
    it('should return null when no context exists', () => {
      expect(audioContextManager.getContext()).toBeNull()
    })

    it('should return the context when it exists', () => {
      const context = audioContextManager.createContext()
      expect(audioContextManager.getContext()).toBe(context)
    })
  })
})
