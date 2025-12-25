import type { DrumSound, AudioEngineState } from '@/types/audio.types'

class AudioEngine {
  private context: AudioContext | null = null
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
    if (this.context) {
      // Resume if suspended (iOS requirement)
      if (this.context.state === 'suspended') {
        await this.context.resume()
      }
      return
    }

    try {
      this.setState('loading')
      this.context = new AudioContext()
      this.gainNode = this.context.createGain()
      this.gainNode.connect(this.context.destination)

      await this.loadSounds(sounds)
      this.setState('ready')
    } catch (error) {
      console.error('Failed to initialize audio engine:', error)
      this.setState('error')
      throw error
    }
  }

  private async loadSounds(sounds: DrumSound[]): Promise<void> {
    const loadPromises = sounds.map(async (sound) => {
      try {
        const response = await fetch(sound.url)
        const arrayBuffer = await response.arrayBuffer()
        const audioBuffer = await this.context!.decodeAudioData(arrayBuffer)
        this.buffers.set(sound.id, audioBuffer)
      } catch (error) {
        console.warn(`Failed to load sound: ${sound.name}`, error)
      }
    })

    await Promise.all(loadPromises)
  }

  play(soundId: string): void {
    if (!this.context || !this.gainNode) {
      console.warn('Audio engine not initialized')
      return
    }

    const buffer = this.buffers.get(soundId)
    if (!buffer) {
      console.warn(`Sound not found: ${soundId}`)
      return
    }

    const source = this.context.createBufferSource()
    source.buffer = buffer
    source.connect(this.gainNode)
    source.start(0)
  }

  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume))
    }
  }

  getVolume(): number {
    return this.gainNode?.gain.value ?? 1
  }

  // Schedule a sound to play at a specific time (for sequencer)
  schedulePlay(soundId: string, time: number): void {
    if (!this.context || !this.gainNode) return

    const buffer = this.buffers.get(soundId)
    if (!buffer) return

    const source = this.context.createBufferSource()
    source.buffer = buffer
    source.connect(this.gainNode)
    source.start(time)
  }

  getCurrentTime(): number {
    return this.context?.currentTime ?? 0
  }

  dispose(): void {
    if (this.context) {
      this.context.close()
      this.context = null
      this.gainNode = null
      this.buffers.clear()
      this.setState('uninitialized')
    }
  }
}

// Singleton instance
export const audioEngine = new AudioEngine()
