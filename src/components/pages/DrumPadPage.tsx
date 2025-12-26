import { useCallback, useState } from 'react'
import { LandscapeLayout } from '@/components/templates/LandscapeLayout'
import { DrumPadGrid } from '@/components/organisms/DrumPadGrid'
import { StepSequencer } from '@/components/organisms/StepSequencer'
import { useAudioEngine } from '@/hooks/use-audio-engine'
import { useSequencer } from '@/hooks/use-sequencer'
import type { DrumSound, SequencerPattern } from '@/types/audio.types'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { PlayButton } from '@/components/atoms/PlayButton'
import { Slider } from '@/components/ui/slider'
import { Volume2, Settings } from 'lucide-react'
import { soundUrls } from '@/audio/sounds'
import { cn } from '@/lib/utils'

// Drum sounds with embedded base64 audio data
const DEFAULT_SOUNDS: DrumSound[] = [
  { id: 'kick', name: 'Kick', url: soundUrls.kick, color: '#ef4444', key: '1' },
  { id: 'snare', name: 'Snare', url: soundUrls.snare, color: '#f97316', key: '2' },
  { id: 'hihat', name: 'Hi-Hat', url: soundUrls.hihat, color: '#eab308', key: '3' },
  { id: 'clap', name: 'Clap', url: soundUrls.clap, color: '#22c55e', key: '4' },
  { id: 'tom1', name: 'Tom 1', url: soundUrls.tom1, color: '#14b8a6', key: 'q' },
  { id: 'tom2', name: 'Tom 2', url: soundUrls.tom2, color: '#3b82f6', key: 'w' },
  { id: 'crash', name: 'Crash', url: soundUrls.crash, color: '#8b5cf6', key: 'e' },
  { id: 'ride', name: 'Ride', url: soundUrls.ride, color: '#ec4899', key: 'r' },
]

const DEFAULT_PATTERN: SequencerPattern = {
  id: 'default',
  name: 'Pattern 1',
  bpm: 120,
  tracks: DEFAULT_SOUNDS.map(sound => ({
    soundId: sound.id,
    steps: Array(16).fill(null).map(() => ({ active: false })),
  })),
}

export function DrumPadPage() {
  const [showSequencer, setShowSequencer] = useState(false)
  const [selectedStep, setSelectedStep] = useState<number | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  const { init, play, needsInit, isLoading } = useAudioEngine(DEFAULT_SOUNDS)
  const { isPlaying, currentStep, bpm, pattern, toggle, setBpm, toggleSoundOnStep } = useSequencer(DEFAULT_PATTERN)

  const handleTrigger = useCallback((soundId: string) => {
    // Always play the sound
    play(soundId)

    // Only add to sequence if: sequencer visible, step selected, and NOT playing
    // This allows jamming over a playing sequence
    if (showSequencer && selectedStep !== null && !isPlaying) {
      toggleSoundOnStep(soundId, selectedStep)
    }
  }, [play, showSequencer, selectedStep, isPlaying, toggleSoundOnStep])

  const handleStepSelect = useCallback((stepIndex: number) => {
    // Toggle selection - tap again to deselect
    setSelectedStep(prev => prev === stepIndex ? null : stepIndex)
  }, [])

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
          <div className="flex items-center gap-3">
            {/* Sequencer toggle */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="sequencer-toggle"
                className="text-sm text-muted-foreground hidden sm:inline"
              >
                Seq
              </label>
              <Switch
                id="sequencer-toggle"
                checked={showSequencer}
                onCheckedChange={setShowSequencer}
              />
            </div>

            {/* Play button - only when sequencer is on */}
            {showSequencer && (
              <PlayButton isPlaying={isPlaying} onToggle={toggle} />
            )}

            {/* Settings button */}
            {showSequencer && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(!showSettings)}
                className={cn(showSettings && 'bg-secondary')}
              >
                <Settings className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="flex flex-col h-full w-full">
        {/* Settings panel - collapsible */}
        {showSequencer && showSettings && (
          <div className="shrink-0 px-4 py-2 border-b border-border bg-secondary/30">
            <div className="flex items-center gap-4 max-w-md mx-auto">
              <span className="text-sm text-muted-foreground">BPM</span>
              <Slider
                value={[bpm]}
                min={60}
                max={200}
                step={1}
                onValueChange={([v]) => setBpm(v)}
                className="flex-1"
              />
              <span className="text-sm font-mono w-8">{bpm}</span>
            </div>
          </div>
        )}

        {/* Sequencer - when visible */}
        {showSequencer && pattern && (
          <div className="shrink-0 py-3 border-b border-border">
            <StepSequencer
              pattern={pattern}
              sounds={DEFAULT_SOUNDS}
              selectedStep={selectedStep}
              currentStep={currentStep}
              isPlaying={isPlaying}
              onStepSelect={handleStepSelect}
            />
          </div>
        )}

        {/* Drum pads - flex grow to fill remaining space */}
        <div className="flex-1 flex items-center justify-center min-h-0">
          <DrumPadGrid
            sounds={DEFAULT_SOUNDS}
            onTrigger={handleTrigger}
          />
        </div>
      </div>
    </LandscapeLayout>
  )
}
