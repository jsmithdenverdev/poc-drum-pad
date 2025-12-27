// Note frequencies for one octave (C4 to B4)
const NOTE_FREQUENCIES: Record<string, number> = {
  'C3': 130.81,
  'C#3': 138.59,
  'D3': 146.83,
  'D#3': 155.56,
  'E3': 164.81,
  'F3': 174.61,
  'F#3': 185.00,
  'G3': 196.00,
  'G#3': 207.65,
  'A3': 220.00,
  'A#3': 233.08,
  'B3': 246.94,
  'C4': 261.63,
  'C#4': 277.18,
  'D4': 293.66,
  'D#4': 311.13,
  'E4': 329.63,
  'F4': 349.23,
  'F#4': 369.99,
  'G4': 392.00,
  'G#4': 415.30,
  'A4': 440.00,
  'A#4': 466.16,
  'B4': 493.88,
  'C5': 523.25,
  'C#5': 554.37,
  'D5': 587.33,
  'D#5': 622.25,
  'E5': 659.25,
  'F5': 698.46,
  'F#5': 739.99,
  'G5': 783.99,
  'G#5': 830.61,
  'A5': 880.00,
  'A#5': 932.33,
  'B5': 987.77,
}

export type WaveformType = 'sine' | 'square' | 'sawtooth' | 'triangle'

export interface SynthNote {
  id: string
  note: string
  frequency: number
  color: string
  isBlackKey: boolean
}

// Define the synth notes (one octave for now, can expand)
export const SYNTH_NOTES: SynthNote[] = [
  { id: 'synth-C4', note: 'C4', frequency: NOTE_FREQUENCIES['C4'], color: '#ffffff', isBlackKey: false },
  { id: 'synth-C#4', note: 'C#4', frequency: NOTE_FREQUENCIES['C#4'], color: '#1a1a1a', isBlackKey: true },
  { id: 'synth-D4', note: 'D4', frequency: NOTE_FREQUENCIES['D4'], color: '#ffffff', isBlackKey: false },
  { id: 'synth-D#4', note: 'D#4', frequency: NOTE_FREQUENCIES['D#4'], color: '#1a1a1a', isBlackKey: true },
  { id: 'synth-E4', note: 'E4', frequency: NOTE_FREQUENCIES['E4'], color: '#ffffff', isBlackKey: false },
  { id: 'synth-F4', note: 'F4', frequency: NOTE_FREQUENCIES['F4'], color: '#ffffff', isBlackKey: false },
  { id: 'synth-F#4', note: 'F#4', frequency: NOTE_FREQUENCIES['F#4'], color: '#1a1a1a', isBlackKey: true },
  { id: 'synth-G4', note: 'G4', frequency: NOTE_FREQUENCIES['G4'], color: '#ffffff', isBlackKey: false },
  { id: 'synth-G#4', note: 'G#4', frequency: NOTE_FREQUENCIES['G#4'], color: '#1a1a1a', isBlackKey: true },
  { id: 'synth-A4', note: 'A4', frequency: NOTE_FREQUENCIES['A4'], color: '#ffffff', isBlackKey: false },
  { id: 'synth-A#4', note: 'A#4', frequency: NOTE_FREQUENCIES['A#4'], color: '#1a1a1a', isBlackKey: true },
  { id: 'synth-B4', note: 'B4', frequency: NOTE_FREQUENCIES['B4'], color: '#ffffff', isBlackKey: false },
  { id: 'synth-C5', note: 'C5', frequency: NOTE_FREQUENCIES['C5'], color: '#ffffff', isBlackKey: false },
]

// ADSR envelope settings
interface EnvelopeSettings {
  attack: number   // seconds
  decay: number    // seconds
  sustain: number  // level 0-1
  release: number  // seconds
}

// Full synth settings
export interface SynthSettings {
  waveform: WaveformType
  octave: number      // -2 to +2
  detune: number      // cents (-100 to +100)
  attack: number      // seconds
  release: number     // seconds
  filterCutoff: number // Hz (200 to 8000)
}

export const DEFAULT_SYNTH_SETTINGS: SynthSettings = {
  waveform: 'sawtooth',
  octave: 0,
  detune: 0,
  attack: 0.01,
  release: 0.3,
  filterCutoff: 8000,
}

interface ActiveNote {
  oscillator: OscillatorNode
  envelope: GainNode
  filter: BiquadFilterNode
}

class SynthEngine {
  private context: AudioContext | null = null
  private gainNode: GainNode | null = null
  private settings: SynthSettings = { ...DEFAULT_SYNTH_SETTINGS }
  private envelope: EnvelopeSettings = {
    attack: 0.01,
    decay: 0.1,
    sustain: 0.3,
    release: 0.3,
  }
  private activeNotes: Map<string, ActiveNote> = new Map()

  setContext(context: AudioContext, gainNode: GainNode): void {
    this.context = context
    this.gainNode = gainNode
  }

  setWaveform(waveform: WaveformType): void {
    this.settings.waveform = waveform
  }

  getWaveform(): WaveformType {
    return this.settings.waveform
  }

  setOctave(octave: number): void {
    this.settings.octave = Math.max(-2, Math.min(2, octave))
  }

  getOctave(): number {
    return this.settings.octave
  }

  setDetune(cents: number): void {
    this.settings.detune = Math.max(-100, Math.min(100, cents))
  }

  getDetune(): number {
    return this.settings.detune
  }

  setAttack(seconds: number): void {
    this.settings.attack = Math.max(0.01, Math.min(1, seconds))
    this.envelope.attack = this.settings.attack
  }

  getAttack(): number {
    return this.settings.attack
  }

  setRelease(seconds: number): void {
    this.settings.release = Math.max(0.05, Math.min(2, seconds))
    this.envelope.release = this.settings.release
  }

  getRelease(): number {
    return this.settings.release
  }

  setFilterCutoff(hz: number): void {
    this.settings.filterCutoff = Math.max(200, Math.min(8000, hz))
  }

  getFilterCutoff(): number {
    return this.settings.filterCutoff
  }

  getSettings(): SynthSettings {
    return { ...this.settings }
  }

  setEnvelope(settings: Partial<EnvelopeSettings>): void {
    this.envelope = { ...this.envelope, ...settings }
  }

  // Start a sustained note (for manual playing with noteOn/noteOff)
  noteOn(noteId: string): void {
    if (!this.context || !this.gainNode) return

    // Stop existing note if any
    this.noteOff(noteId)

    const note = SYNTH_NOTES.find(n => n.id === noteId)
    if (!note) {
      console.warn(`Synth note not found: ${noteId}`)
      return
    }

    // Apply octave shift
    const frequency = note.frequency * Math.pow(2, this.settings.octave)

    const { attack, decay, sustain } = this.envelope
    const now = this.context.currentTime

    // Create oscillator
    const oscillator = this.context.createOscillator()
    oscillator.type = this.settings.waveform
    oscillator.frequency.value = frequency
    oscillator.detune.value = this.settings.detune

    // Create low-pass filter
    const filter = this.context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = this.settings.filterCutoff
    filter.Q.value = 1

    // Create envelope gain node
    const envelopeGain = this.context.createGain()
    envelopeGain.gain.setValueAtTime(0, now)

    // Attack
    envelopeGain.gain.linearRampToValueAtTime(0.5, now + attack)

    // Decay to sustain
    envelopeGain.gain.linearRampToValueAtTime(sustain * 0.5, now + attack + decay)

    // Connect: oscillator -> filter -> envelope -> main gain -> destination
    oscillator.connect(filter)
    filter.connect(envelopeGain)
    envelopeGain.connect(this.gainNode)

    // Start oscillator
    oscillator.start(now)

    // Store active note
    this.activeNotes.set(noteId, { oscillator, envelope: envelopeGain, filter })
  }

  // Stop a sustained note (for manual playing)
  noteOff(noteId: string): void {
    const activeNote = this.activeNotes.get(noteId)
    if (!activeNote || !this.context) return

    const { oscillator, envelope: envelopeGain } = activeNote
    const { release } = this.envelope
    const now = this.context.currentTime

    // Cancel any scheduled changes and get current gain value
    envelopeGain.gain.cancelScheduledValues(now)
    const currentGain = envelopeGain.gain.value

    // Apply release envelope from current value
    envelopeGain.gain.setValueAtTime(currentGain, now)
    envelopeGain.gain.linearRampToValueAtTime(0, now + release)

    // Stop oscillator after release
    oscillator.stop(now + release + 0.1)

    // Remove from active notes
    this.activeNotes.delete(noteId)
  }

  // Play a note immediately (for pad triggers)
  playNote(noteId: string): void {
    if (!this.context || !this.gainNode) return

    const note = SYNTH_NOTES.find(n => n.id === noteId)
    if (!note) {
      console.warn(`Synth note not found: ${noteId}`)
      return
    }

    // Apply octave shift
    const frequency = note.frequency * Math.pow(2, this.settings.octave)
    this.playFrequency(frequency, this.context.currentTime)
  }

  // Schedule a note to play at a specific time (for sequencer)
  scheduleNote(noteId: string, time: number): void {
    if (!this.context || !this.gainNode) return

    const note = SYNTH_NOTES.find(n => n.id === noteId)
    if (!note) return

    // Apply octave shift
    const frequency = note.frequency * Math.pow(2, this.settings.octave)
    this.playFrequency(frequency, time)
  }

  private playFrequency(frequency: number, startTime: number): void {
    if (!this.context || !this.gainNode) return

    const { attack, decay, sustain, release } = this.envelope

    // Create oscillator
    const oscillator = this.context.createOscillator()
    oscillator.type = this.settings.waveform
    oscillator.frequency.value = frequency
    oscillator.detune.value = this.settings.detune

    // Create low-pass filter
    const filter = this.context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = this.settings.filterCutoff
    filter.Q.value = 1

    // Create envelope gain node
    const envelopeGain = this.context.createGain()
    envelopeGain.gain.setValueAtTime(0, startTime)

    // Attack
    envelopeGain.gain.linearRampToValueAtTime(0.5, startTime + attack)

    // Decay to sustain
    envelopeGain.gain.linearRampToValueAtTime(sustain * 0.5, startTime + attack + decay)

    // Release
    const releaseStart = startTime + attack + decay + 0.1
    envelopeGain.gain.setValueAtTime(sustain * 0.5, releaseStart)
    envelopeGain.gain.linearRampToValueAtTime(0, releaseStart + release)

    // Connect: oscillator -> filter -> envelope -> main gain -> destination
    oscillator.connect(filter)
    filter.connect(envelopeGain)
    envelopeGain.connect(this.gainNode)

    // Start and stop
    oscillator.start(startTime)
    oscillator.stop(releaseStart + release + 0.1)
  }

  // Check if a soundId is a synth note
  static isSynthNote(soundId: string): boolean {
    return soundId.startsWith('synth-')
  }

  // Get frequency for a note
  static getFrequency(note: string): number | undefined {
    return NOTE_FREQUENCIES[note]
  }
}

export const synthEngine = new SynthEngine()
