import { useCallback, useState } from 'react'
import { LandscapeLayout } from '@/components/templates/LandscapeLayout'
import { DrumPadGrid } from '@/components/organisms/DrumPadGrid'
import { StepSequencer } from '@/components/organisms/StepSequencer'
import type { DrumSound, SequencerPattern } from '@/types/audio.types'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { PlayButton } from '@/components/atoms/PlayButton'
import { Slider } from '@/components/ui/slider'
import { Settings, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DrumPadPageProps {
  sounds: DrumSound[]
  pattern: SequencerPattern
  isPlaying: boolean
  currentStep: number
  bpm: number
  showSequencer: boolean
  selectedStep: number | null
  onPlay: (soundId: string) => void
  onToggle: () => Promise<void>
  onSetBpm: (bpm: number) => void
  onShowSequencerChange: (show: boolean) => void
  onStepSelect: (stepIndex: number) => void
  onToggleSoundOnStep: (soundId: string, stepIndex: number) => void
  onClearPattern: () => void
}

export function DrumPadPage({
  sounds,
  pattern,
  isPlaying,
  currentStep,
  bpm,
  showSequencer,
  selectedStep,
  onPlay,
  onToggle,
  onSetBpm,
  onShowSequencerChange,
  onStepSelect,
  onToggleSoundOnStep,
  onClearPattern,
}: DrumPadPageProps) {
  const [showSettings, setShowSettings] = useState(false)

  const handleTrigger = useCallback((soundId: string) => {
    // Always play the sound
    onPlay(soundId)

    // Only add to sequence if: sequencer visible, step selected, and NOT playing
    // This allows jamming over a playing sequence
    if (showSequencer && selectedStep !== null && !isPlaying) {
      onToggleSoundOnStep(soundId, selectedStep)
    }
  }, [onPlay, showSequencer, selectedStep, isPlaying, onToggleSoundOnStep])

  // Filter pattern to only show drum tracks
  const drumPattern: SequencerPattern = {
    ...pattern,
    tracks: pattern.tracks.filter(track => track.soundType === 'drum'),
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
                onCheckedChange={onShowSequencerChange}
              />
            </div>

            {/* Play button - only when sequencer is on */}
            {showSequencer && (
              <PlayButton isPlaying={isPlaying} onToggle={onToggle} />
            )}

            {/* Clear button */}
            {showSequencer && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClearPattern}
                title="Clear pattern"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
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
                onValueChange={([v]) => onSetBpm(v)}
                className="flex-1"
              />
              <span className="text-sm font-mono w-8">{bpm}</span>
            </div>
          </div>
        )}

        {/* Sequencer - when visible */}
        {showSequencer && drumPattern && (
          <div className="shrink-0 py-3 border-b border-border">
            <StepSequencer
              pattern={drumPattern}
              sounds={sounds}
              selectedStep={selectedStep}
              currentStep={currentStep}
              isPlaying={isPlaying}
              onStepSelect={onStepSelect}
            />
          </div>
        )}

        {/* Drum pads - flex grow to fill remaining space */}
        <div className="flex-1 flex items-center justify-center min-h-0">
          <DrumPadGrid
            sounds={sounds}
            onTrigger={handleTrigger}
          />
        </div>
      </div>
    </LandscapeLayout>
  )
}
