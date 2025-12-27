import type { SequencerPattern } from '@/types/audio.types'

const MAX_STEPS = 32

// Helper to create a step array with active beats
function createSteps(activeBeatIndices: number[]): { active: boolean }[] {
  return Array(MAX_STEPS).fill(null).map((_, i) => ({
    active: activeBeatIndices.includes(i)
  }))
}

export const PRESET_PATTERNS: SequencerPattern[] = [
  {
    id: 'basic-rock',
    name: 'Basic Rock',
    bpm: 120,
    tracks: [
      // Kick on 1, 5, 9, 13 (every 4 beats)
      { soundId: 'kick', soundType: 'drum', steps: createSteps([0, 4, 8, 12]) },
      // Snare on 5, 13 (backbeat on 2 and 4)
      { soundId: 'snare', soundType: 'drum', steps: createSteps([4, 12]) },
      // Hi-hat on every other beat (eighth notes)
      { soundId: 'hihat', soundType: 'drum', steps: createSteps([0, 2, 4, 6, 8, 10, 12, 14]) },
      // No clap
      { soundId: 'clap', soundType: 'drum', steps: createSteps([]) },
      // No toms
      { soundId: 'tom1', soundType: 'drum', steps: createSteps([]) },
      { soundId: 'tom2', soundType: 'drum', steps: createSteps([]) },
      // No crash
      { soundId: 'crash', soundType: 'drum', steps: createSteps([]) },
      // No ride
      { soundId: 'ride', soundType: 'drum', steps: createSteps([]) },
    ]
  },
  {
    id: 'disco',
    name: 'Disco',
    bpm: 110,
    tracks: [
      // Kick on every beat (four-on-the-floor)
      { soundId: 'kick', soundType: 'drum', steps: createSteps([0, 4, 8, 12]) },
      // Snare/clap on 2 and 4
      { soundId: 'snare', soundType: 'drum', steps: createSteps([4, 12]) },
      // Hi-hat on every beat and off-beat
      { soundId: 'hihat', soundType: 'drum', steps: createSteps([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]) },
      // Clap with snare
      { soundId: 'clap', soundType: 'drum', steps: createSteps([4, 12]) },
      // No toms
      { soundId: 'tom1', soundType: 'drum', steps: createSteps([]) },
      { soundId: 'tom2', soundType: 'drum', steps: createSteps([]) },
      // No crash
      { soundId: 'crash', soundType: 'drum', steps: createSteps([]) },
      // No ride
      { soundId: 'ride', soundType: 'drum', steps: createSteps([]) },
    ]
  },
  {
    id: 'hip-hop',
    name: 'Hip Hop',
    bpm: 95,
    tracks: [
      // Kick on 1, 7, 13
      { soundId: 'kick', soundType: 'drum', steps: createSteps([0, 6, 12]) },
      // Snare on 5, 13 (backbeat)
      { soundId: 'snare', soundType: 'drum', steps: createSteps([4, 12]) },
      // Hi-hat on every other beat
      { soundId: 'hihat', soundType: 'drum', steps: createSteps([0, 2, 4, 6, 8, 10, 12, 14]) },
      // Clap layered with snare
      { soundId: 'clap', soundType: 'drum', steps: createSteps([4, 12]) },
      // No toms
      { soundId: 'tom1', soundType: 'drum', steps: createSteps([]) },
      { soundId: 'tom2', soundType: 'drum', steps: createSteps([]) },
      // No crash
      { soundId: 'crash', soundType: 'drum', steps: createSteps([]) },
      // No ride
      { soundId: 'ride', soundType: 'drum', steps: createSteps([]) },
    ]
  },
  {
    id: 'breakbeat',
    name: 'Breakbeat',
    bpm: 140,
    tracks: [
      // Kick on 1, 7, 10, 13
      { soundId: 'kick', soundType: 'drum', steps: createSteps([0, 6, 9, 12]) },
      // Snare on 5, 11, 14
      { soundId: 'snare', soundType: 'drum', steps: createSteps([4, 10, 13]) },
      // Hi-hat on every beat
      { soundId: 'hihat', soundType: 'drum', steps: createSteps([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]) },
      // No clap
      { soundId: 'clap', soundType: 'drum', steps: createSteps([]) },
      // No toms
      { soundId: 'tom1', soundType: 'drum', steps: createSteps([]) },
      { soundId: 'tom2', soundType: 'drum', steps: createSteps([]) },
      // Crash on first beat
      { soundId: 'crash', soundType: 'drum', steps: createSteps([0]) },
      // No ride
      { soundId: 'ride', soundType: 'drum', steps: createSteps([]) },
    ]
  },
  {
    id: 'house',
    name: 'House',
    bpm: 125,
    tracks: [
      // Kick on every beat (four-on-the-floor)
      { soundId: 'kick', soundType: 'drum', steps: createSteps([0, 4, 8, 12]) },
      // Snare/clap on 2 and 4
      { soundId: 'snare', soundType: 'drum', steps: createSteps([4, 12]) },
      // Hi-hat on off-beats
      { soundId: 'hihat', soundType: 'drum', steps: createSteps([2, 6, 10, 14]) },
      // Clap with snare
      { soundId: 'clap', soundType: 'drum', steps: createSteps([4, 12]) },
      // No toms
      { soundId: 'tom1', soundType: 'drum', steps: createSteps([]) },
      { soundId: 'tom2', soundType: 'drum', steps: createSteps([]) },
      // Crash on first beat
      { soundId: 'crash', soundType: 'drum', steps: createSteps([0]) },
      // No ride
      { soundId: 'ride', soundType: 'drum', steps: createSteps([]) },
    ]
  },
]
