export interface DrumSound {
  id: string
  name: string
  url: string
  color: string
  key?: string // keyboard shortcut
}

export interface SynthSound {
  id: string
  note: string
  frequency: number
  color: string
  isBlackKey: boolean
}

export type SoundType = 'drum' | 'synth'

export interface SequencerStep {
  active: boolean
}

export interface SequencerTrack {
  soundId: string
  soundType: SoundType
  steps: SequencerStep[]
}

export interface SequencerPattern {
  id: string
  name: string
  bpm: number
  tracks: SequencerTrack[]
}

export type AudioEngineState = 'uninitialized' | 'loading' | 'ready' | 'error'
