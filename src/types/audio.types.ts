export interface SoundDisplay {
  id: string
  name: string
  color: string
}

export interface DrumSound extends SoundDisplay {
  url: string
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
  volume?: number // 0-1, defaults to 1
}

export interface SequencerPattern {
  id: string
  name: string
  bpm: number
  tracks: SequencerTrack[]
}

export type AudioEngineState = 'uninitialized' | 'loading' | 'ready' | 'error'

// Sequencer configuration
export type StepCount = 4 | 8 | 16 | 32
export const STEP_COUNT_OPTIONS: StepCount[] = [4, 8, 16, 32]

export interface SequencerConfig {
  stepCount: StepCount
  hiddenTracks: Set<string> // Track soundIds that are hidden
}

// Timeline types for full track arrangement
export interface TimelineBlock {
  id: string
  patternId: string // References a saved pattern
  startMeasure: number // Position in the timeline (0-indexed)
  lengthMeasures: number // Duration in measures
}

export interface TimelineTrack {
  id: string
  name: string
  color: string
  muted: boolean
  volume: number // 0-1
  blocks: TimelineBlock[]
}

// Scene types for scene-based workflow
export type SceneDuration = 4 | 8 | 16

export interface Scene {
  id: string
  name: string
  duration: SceneDuration
  trackPatterns: Record<string, string> // trackId -> patternId
}

export interface Timeline {
  id: string
  name: string
  bpm: number
  tracks: TimelineTrack[] // Track-based model for arrangement
  scenes?: Scene[] // Optional scene-based workflow
}

// Color palette for auto-assigning track colors
export const TIMELINE_TRACK_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
]

// Saved patterns that can be referenced in timeline
export interface SavedPattern extends SequencerPattern {
  createdAt: number
  updatedAt: number
}
