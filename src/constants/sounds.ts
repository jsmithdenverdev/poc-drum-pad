import { soundUrls } from '@/audio/sounds'
import type { DrumSound } from '@/types/audio.types'

export const DRUM_SOUNDS: DrumSound[] = [
  { id: 'kick', name: 'Kick', url: soundUrls.kick, color: '#f43f5e', key: '1' },
  { id: 'snare', name: 'Snare', url: soundUrls.snare, color: '#fb923c', key: '2' },
  { id: 'hihat', name: 'Hi-Hat', url: soundUrls.hihat, color: '#fbbf24', key: '3' },
  { id: 'clap', name: 'Clap', url: soundUrls.clap, color: '#4ade80', key: '4' },
  { id: 'tom1', name: 'Tom 1', url: soundUrls.tom1, color: '#2dd4bf', key: 'q' },
  { id: 'tom2', name: 'Tom 2', url: soundUrls.tom2, color: '#38bdf8', key: 'w' },
  { id: 'crash', name: 'Crash', url: soundUrls.crash, color: '#a78bfa', key: 'e' },
  { id: 'ride', name: 'Ride', url: soundUrls.ride, color: '#f472b6', key: 'r' },
]
