import { useCallback } from 'react'
import { DrumPadGrid } from '@/components/organisms/DrumPadGrid'
import { StepSequencer } from '@/components/organisms/StepSequencer'
import { SequencerConfig } from '@/components/molecules/SequencerConfig'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { PlayButton } from '@/components/atoms/PlayButton'
import { Settings, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAudio, useSequencerContext } from '@/contexts'
import { DRUM_SOUNDS, ALL_SOUNDS_FOR_DISPLAY } from '@/constants'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'

interface DrumPadPageProps {
  onNavigate?: (page: number) => void
}

export function DrumPadPage({ onNavigate: _onNavigate }: DrumPadPageProps) {
  const { play } = useAudio()
  const {
    pattern,
    isPlaying,
    currentStep,
    bpm,
    stepCount,
    hiddenTracks,
    toggle,
    setBpm,
    toggleTrackVisibility,
    showSequencer,
    setShowSequencer,
    selectedStep,
    showSettings,
    setShowSettings,
    toggleSoundOnStep,
    clearPattern,
    handleStepSelect,
    handleStepCountChange,
  } = useSequencerContext()

  const handleTrigger = useCallback((soundId: string) => {
    // Always play the sound
    play(soundId)

    // Only add to sequence if: sequencer visible, step selected, and NOT playing
    if (showSequencer && selectedStep !== null && !isPlaying) {
      toggleSoundOnStep(soundId, selectedStep, 'drum')
    }
  }, [play, showSequencer, selectedStep, isPlaying, toggleSoundOnStep])

  // Enable keyboard shortcuts for drum pads
  useKeyboardShortcuts({
    onTrigger: handleTrigger,
    enabled: true,
  })

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 px-4 py-2 border-b border-border">
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

            {/* Clear button */}
            {showSequencer && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearPattern}
                title="Clear pattern"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            )}

            {/* Settings button - always visible */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              className={cn(showSettings && 'bg-secondary')}
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Settings panel - collapsible */}
      {showSettings && (
        <div className="flex-shrink-0 px-4 py-3 border-b border-border bg-secondary/30 space-y-4">
          <div className="max-w-lg mx-auto space-y-4">
            <SequencerConfig
              bpm={bpm}
              stepCount={stepCount}
              tracks={DRUM_SOUNDS}
              hiddenTracks={hiddenTracks}
              onBpmChange={setBpm}
              onStepCountChange={handleStepCountChange}
              onToggleTrackVisibility={toggleTrackVisibility}
            />
          </div>
        </div>
      )}

      {/* Sequencer - when visible */}
      {showSequencer && (
        <div className="flex-shrink-0 py-3 border-b border-border">
          <StepSequencer
            pattern={pattern}
            sounds={ALL_SOUNDS_FOR_DISPLAY}
            selectedStep={selectedStep}
            currentStep={currentStep}
            isPlaying={isPlaying}
            stepCount={stepCount}
            hiddenTracks={hiddenTracks}
            onStepSelect={handleStepSelect}
          />
        </div>
      )}

      {/* Drum pads - flex grow to fill remaining space */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        <DrumPadGrid
          sounds={DRUM_SOUNDS}
          onTrigger={handleTrigger}
        />
      </div>
    </div>
  )
}
