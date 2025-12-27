import type { SequencerPattern } from '@/types/audio.types'
import { DRUM_SOUNDS } from './sounds'

// Maximum steps - always store this many to preserve data when changing step count
export const MAX_STEPS = 32

// Swipe threshold in pixels
export const SWIPE_THRESHOLD = 50

// Initial pattern with drum tracks only (synth tracks added dynamically)
export const DEFAULT_PATTERN: SequencerPattern = {
  id: 'default',
  name: 'Pattern 1',
  bpm: 120,
  tracks: DRUM_SOUNDS.map(sound => ({
    soundId: sound.id,
    soundType: 'drum' as const,
    steps: Array(MAX_STEPS).fill(null).map(() => ({ active: false })),
  })),
}
