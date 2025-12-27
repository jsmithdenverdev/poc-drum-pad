import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Web Audio API
class MockAudioContext {
  state = 'running'
  currentTime = 0
  destination = {}
  onstatechange: (() => void) | null = null

  createGain() {
    return {
      gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
    }
  }

  createBufferSource() {
    return {
      buffer: null,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    }
  }

  createOscillator() {
    return {
      type: 'sine',
      frequency: { value: 440, setValueAtTime: vi.fn() },
      detune: { value: 0 },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    }
  }

  createBiquadFilter() {
    return {
      type: 'lowpass',
      frequency: { value: 1000 },
      Q: { value: 1 },
      connect: vi.fn(),
    }
  }

  decodeAudioData(buffer: ArrayBuffer) {
    return Promise.resolve({ duration: 1, length: 44100, numberOfChannels: 2 })
  }

  resume() {
    this.state = 'running'
    if (this.onstatechange) {
      this.onstatechange()
    }
    return Promise.resolve()
  }

  close() {
    return Promise.resolve()
  }
}

// @ts-ignore
global.AudioContext = MockAudioContext
// @ts-ignore
global.fetch = vi.fn()
