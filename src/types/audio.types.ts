export interface DrumSound {
  id: string
  name: string
  url: string
  color: string
  key?: string // keyboard shortcut
}

export interface SequencerStep {
  active: boolean
}

export interface SequencerTrack {
  soundId: string
  steps: SequencerStep[]
}

export interface SequencerPattern {
  id: string
  name: string
  bpm: number
  tracks: SequencerTrack[]
}

export type AudioEngineState = 'uninitialized' | 'loading' | 'ready' | 'error'
