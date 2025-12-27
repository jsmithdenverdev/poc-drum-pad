import { soundUrls } from '@/audio/sounds'
import type { DrumSound } from '@/types/audio.types'

export const DRUM_SOUNDS: DrumSound[] = [
  { id: 'kick', name: 'Kick', url: soundUrls.kick, color: '#ef4444', key: '1' },
  { id: 'snare', name: 'Snare', url: soundUrls.snare, color: '#f97316', key: '2' },
  { id: 'hihat', name: 'Hi-Hat', url: soundUrls.hihat, color: '#eab308', key: '3' },
  { id: 'clap', name: 'Clap', url: soundUrls.clap, color: '#22c55e', key: '4' },
  { id: 'tom1', name: 'Tom 1', url: soundUrls.tom1, color: '#14b8a6', key: 'q' },
  { id: 'tom2', name: 'Tom 2', url: soundUrls.tom2, color: '#3b82f6', key: 'w' },
  { id: 'crash', name: 'Crash', url: soundUrls.crash, color: '#8b5cf6', key: 'e' },
  { id: 'ride', name: 'Ride', url: soundUrls.ride, color: '#ec4899', key: 'r' },
]
