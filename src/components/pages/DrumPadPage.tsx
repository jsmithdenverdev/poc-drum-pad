import { useCallback } from 'react'
import { LandscapeLayout } from '@/components/templates/LandscapeLayout'
import { DrumPadGrid } from '@/components/organisms/DrumPadGrid'
import { TransportControls } from '@/components/molecules/TransportControls'
import { useAudioEngine } from '@/hooks/use-audio-engine'
import { useSequencer } from '@/hooks/use-sequencer'
import type { DrumSound, SequencerPattern } from '@/types/audio.types'
import { Button } from '@/components/ui/button'
import { Volume2 } from 'lucide-react'

// Default drum sounds - in production, these would be real audio files
const DEFAULT_SOUNDS: DrumSound[] = [
  { id: 'kick', name: 'Kick', url: '/sounds/kick.wav', color: '#ef4444', key: '1' },
  { id: 'snare', name: 'Snare', url: '/sounds/snare.wav', color: '#f97316', key: '2' },
  { id: 'hihat', name: 'Hi-Hat', url: '/sounds/hihat.wav', color: '#eab308', key: '3' },
  { id: 'clap', name: 'Clap', url: '/sounds/clap.wav', color: '#22c55e', key: '4' },
  { id: 'tom1', name: 'Tom 1', url: '/sounds/tom1.wav', color: '#14b8a6', key: 'q' },
  { id: 'tom2', name: 'Tom 2', url: '/sounds/tom2.wav', color: '#3b82f6', key: 'w' },
  { id: 'crash', name: 'Crash', url: '/sounds/crash.wav', color: '#8b5cf6', key: 'e' },
  { id: 'ride', name: 'Ride', url: '/sounds/ride.wav', color: '#ec4899', key: 'r' },
]

const DEFAULT_PATTERN: SequencerPattern = {
  id: 'default',
  name: 'Pattern 1',
  bpm: 120,
  tracks: DEFAULT_SOUNDS.map(sound => ({
    soundId: sound.id,
    steps: Array(16).fill({ active: false }),
  })),
}

export function DrumPadPage() {
  const { init, play, needsInit, isLoading } = useAudioEngine(DEFAULT_SOUNDS)
  const { isPlaying, bpm, toggle, setBpm } = useSequencer(DEFAULT_PATTERN)

  const handleTrigger = useCallback((soundId: string) => {
    play(soundId)
  }, [play])

  const handleInit = useCallback(async () => {
    await init()
  }, [init])

  // Show init screen if audio not ready
  if (needsInit) {
    return (
      <LandscapeLayout>
        <div className="flex flex-col items-center justify-center gap-6 p-8 text-center">
          <h1 className="text-3xl font-bold">Drum Pad</h1>
          <p className="text-muted-foreground max-w-md">
            Tap the button below to start. Audio requires user interaction on mobile devices.
          </p>
          <Button size="lg" onClick={handleInit} className="gap-2">
            <Volume2 className="w-5 h-5" />
            Start Audio
          </Button>
        </div>
      </LandscapeLayout>
    )
  }

  if (isLoading) {
    return (
      <LandscapeLayout>
        <div className="flex items-center justify-center">
          <p className="text-muted-foreground">Loading sounds...</p>
        </div>
      </LandscapeLayout>
    )
  }

  return (
    <LandscapeLayout
      header={
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Drum Pad</h1>
          <TransportControls
            isPlaying={isPlaying}
            bpm={bpm}
            onToggle={toggle}
            onBpmChange={setBpm}
          />
        </div>
      }
    >
      <DrumPadGrid
        sounds={DEFAULT_SOUNDS}
        onTrigger={handleTrigger}
      />
    </LandscapeLayout>
  )
}
