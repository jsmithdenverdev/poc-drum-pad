import type { DrumSound, AudioEngineState } from '@/types/audio.types'
import { synthEngine } from './synth-engine'
import { audioContextManager } from './audio-context-manager'

class AudioEngine {
  private buffers: Map<string, AudioBuffer> = new Map()
  private gainNode: GainNode | null = null
  private _state: AudioEngineState = 'uninitialized'
  private stateListeners: Set<(state: AudioEngineState) => void> = new Set()

  get state(): AudioEngineState {
    return this._state
  }

  private setState(state: AudioEngineState) {
    this._state = state
    this.stateListeners.forEach(listener => listener(state))
  }

  onStateChange(listener: (state: AudioEngineState) => void): () => void {
    this.stateListeners.add(listener)
    return () => {
      this.stateListeners.delete(listener)
    }
  }

  async init(sounds: DrumSound[]): Promise<void> {
    const context = audioContextManager.getContext()
    if (context) {
      // Resume if suspended (iOS requirement)
      await audioContextManager.ensureRunning()
      return
    }

    try {
      this.setState('loading')
      const newContext = audioContextManager.createContext()
      this.gainNode = newContext.createGain()
      this.gainNode.connect(newContext.destination)

      await this.loadSounds(sounds)

      // Initialize synth engine with the audio context
      synthEngine.setContext(newContext, this.gainNode)

      this.setState('ready')
    } catch (error) {
      console.error('Failed to initialize audio engine:', error)
      this.setState('error')
      throw error
    }
  }

  /**
   * Explicitly resume the audio context (call on user interaction after visibility change).
   * Delegates to the centralized AudioContextManager.
   */
  async resume(): Promise<boolean> {
    return await audioContextManager.ensureRunning()
  }

  get isSuspended(): boolean {
    return audioContextManager.isSuspended
  }

  get isRunning(): boolean {
    return audioContextManager.isRunning
  }

  private async loadSounds(sounds: DrumSound[]): Promise<void> {
    const context = audioContextManager.getContext()
    if (!context) {
      throw new Error('AudioContext not initialized')
    }

    const loadPromises = sounds.map(async (sound) => {
      try {
        const response = await fetch(sound.url)
        const contentType = response.headers.get('content-type') || 'unknown'
        console.log(`Fetch ${sound.name}: ${response.status} (${contentType})`)

        if (!response.ok) {
          console.error(`Failed to fetch ${sound.url}: ${response.status}`)
          return
        }

        if (!contentType.includes('audio')) {
          console.error(`Wrong content-type for ${sound.name}: ${contentType}`)
          return
        }

        const arrayBuffer = await response.arrayBuffer()
        console.log(`${sound.name} size: ${arrayBuffer.byteLength} bytes`)

        const audioBuffer = await context.decodeAudioData(arrayBuffer)
        this.buffers.set(sound.id, audioBuffer)
        console.log(`Loaded: ${sound.name}`)
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        console.error(`Failed to load ${sound.name}: ${msg}`)
      }
    })

    await Promise.all(loadPromises)
    console.log(`Audio buffers loaded: ${this.buffers.size}/${sounds.length}`)
  }

  async play(soundId: string): Promise<void> {
    const context = audioContextManager.getContext()
    if (!context || !this.gainNode) {
      console.warn('Audio engine not initialized')
      return
    }

    // Ensure audio context is running
    const isRunning = await audioContextManager.ensureRunning()
    if (!isRunning) {
      console.warn('Cannot play - failed to resume audio context')
      return
    }

    const buffer = this.buffers.get(soundId)
    if (!buffer) {
      console.warn(`Sound not found: ${soundId}`)
      return
    }

    try {
      const source = context.createBufferSource()
      source.buffer = buffer
      source.connect(this.gainNode)
      source.start(0)
    } catch (error) {
      console.error(`Error playing sound ${soundId}:`, error)
    }
  }

  // Test tone to verify audio output works
  playTestTone(): void {
    const context = audioContextManager.getContext()
    if (!context || !this.gainNode) {
      console.warn('Cannot play test tone - not initialized')
      return
    }
    console.log('Playing test tone...')
    const oscillator = context.createOscillator()
    oscillator.type = 'sine'
    oscillator.frequency.value = 440
    oscillator.connect(this.gainNode)
    oscillator.start()
    oscillator.stop(context.currentTime + 0.2)
  }

  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume))
    }
  }

  getVolume(): number {
    return this.gainNode?.gain.value ?? 1
  }

  // Play a synth note immediately (one-shot for sequencer)
  async playSynth(noteId: string): Promise<void> {
    const context = audioContextManager.getContext()
    if (!context || !this.gainNode) {
      console.warn('Audio engine not initialized')
      return
    }

    // Ensure audio context is running
    const isRunning = await audioContextManager.ensureRunning()
    if (!isRunning) {
      console.warn('Cannot play synth - failed to resume audio context')
      return
    }

    synthEngine.playNote(noteId)
  }

  // Start a sustained synth note (for manual playing)
  async noteOn(noteId: string): Promise<void> {
    const context = audioContextManager.getContext()
    if (!context || !this.gainNode) {
      console.warn('Audio engine not initialized')
      return
    }

    // Ensure audio context is running
    const isRunning = await audioContextManager.ensureRunning()
    if (!isRunning) {
      console.warn('Cannot start note - failed to resume audio context')
      return
    }

    synthEngine.noteOn(noteId)
  }

  // Stop a sustained synth note (for manual playing)
  noteOff(noteId: string): void {
    synthEngine.noteOff(noteId)
  }

  // Schedule a sound to play at a specific time (for sequencer)
  schedulePlay(soundId: string, time: number, isSynth: boolean = false, volume: number = 1): void {
    const context = audioContextManager.getContext()
    if (!context || !this.gainNode) return

    // Don't schedule if context is suspended - sequencer should stop
    if (audioContextManager.isSuspended) return

    if (isSynth) {
      synthEngine.scheduleNote(soundId, time, volume)
      return
    }

    const buffer = this.buffers.get(soundId)
    if (!buffer) return

    const source = context.createBufferSource()
    source.buffer = buffer

    // Apply track volume via gain node
    const trackGain = context.createGain()
    trackGain.gain.value = Math.max(0, Math.min(1, volume))
    source.connect(trackGain)
    trackGain.connect(this.gainNode)

    source.start(time)
  }

  getCurrentTime(): number {
    return audioContextManager.currentTime
  }

  dispose(): void {
    audioContextManager.dispose()
    this.gainNode = null
    this.buffers.clear()
    this.setState('uninitialized')
  }
}

// Singleton instance
export const audioEngine = new AudioEngine()
