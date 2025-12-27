import { useCallback, useMemo } from 'react'
import { PianoKeyboard } from '@/components/organisms/PianoKeyboard'
import { StepSequencer } from '@/components/organisms/StepSequencer'
import { SequencerConfig } from '@/components/molecules/SequencerConfig'
import { SynthConfig } from '@/components/molecules/SynthConfig'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { PlayButton } from '@/components/atoms/PlayButton'
import { Settings, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAudio, useSequencerContext } from '@/contexts'
import { DRUM_SOUNDS, ALL_SOUNDS_FOR_DISPLAY } from '@/constants'

interface SynthPageProps {
  onNavigate?: (page: number) => void
}

export function SynthPage({ onNavigate: _onNavigate }: SynthPageProps) {
  const {
    noteOn,
    noteOff,
    synthSettings,
    handleWaveformChange,
    handleOctaveChange,
    handleDetuneChange,
    handleAttackChange,
    handleReleaseChange,
    handleFilterChange,
  } = useAudio()

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
    setTrackVolume,
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

  // Create track volumes Map from pattern
  const trackVolumes = useMemo(() => {
    const volumes = new Map<string, number>()
    pattern.tracks.forEach(track => {
      volumes.set(track.soundId, track.volume ?? 1)
    })
    return volumes
  }, [pattern.tracks])

  const handleNoteOn = useCallback((noteId: string) => {
    // Start sustained note
    noteOn(noteId)

    // Only add to sequence if: sequencer visible, step selected, and NOT playing
    if (showSequencer && selectedStep !== null && !isPlaying) {
      toggleSoundOnStep(noteId, selectedStep, 'synth')
    }
  }, [noteOn, showSequencer, selectedStep, isPlaying, toggleSoundOnStep])

  const handleNoteOff = useCallback((noteId: string) => {
    // Stop sustained note
    noteOff(noteId)
  }, [noteOff])

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 px-4 py-2 border-b border-border">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Synth</h1>
          <div className="flex items-center gap-3">
            {/* Sequencer toggle */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="synth-sequencer-toggle"
                className="text-sm text-muted-foreground hidden sm:inline"
              >
                Seq
              </label>
              <Switch
                id="synth-sequencer-toggle"
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
            {/* Sequencer settings - always visible */}
            <SequencerConfig
              bpm={bpm}
              stepCount={stepCount}
              tracks={DRUM_SOUNDS}
              hiddenTracks={hiddenTracks}
              trackVolumes={trackVolumes}
              onBpmChange={setBpm}
              onStepCountChange={handleStepCountChange}
              onToggleTrackVisibility={toggleTrackVisibility}
              onTrackVolumeChange={setTrackVolume}
            />

            {/* Synth settings - on synth page */}
            <SynthConfig
              settings={synthSettings}
              onWaveformChange={handleWaveformChange}
              onOctaveChange={handleOctaveChange}
              onDetuneChange={handleDetuneChange}
              onAttackChange={handleAttackChange}
              onReleaseChange={handleReleaseChange}
              onFilterChange={handleFilterChange}
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

      {/* Piano keyboard - flex grow to fill remaining space */}
      <div className="flex-1 flex items-center justify-center min-h-0 p-4">
        <PianoKeyboard onNoteOn={handleNoteOn} onNoteOff={handleNoteOff} className="w-full max-w-2xl" />
      </div>
    </div>
  )
}
