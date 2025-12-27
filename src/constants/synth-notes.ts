import { SYNTH_NOTES } from '@/audio/synth-engine'
import type { SoundDisplay } from '@/types/audio.types'
import { DRUM_SOUNDS } from './sounds'

// Synth sounds for sequencer display (all white keys get purple color)
export const SYNTH_SOUNDS_FOR_DISPLAY: SoundDisplay[] = SYNTH_NOTES.map(note => ({
  id: note.id,
  name: note.note,
  color: '#a855f7', // Purple for synth notes
}))

// Combined sounds for sequencer color lookup
export const ALL_SOUNDS_FOR_DISPLAY: SoundDisplay[] = [...DRUM_SOUNDS, ...SYNTH_SOUNDS_FOR_DISPLAY]
