import { useCallback, useState } from 'react'
import { LandscapeLayout } from '@/components/templates/LandscapeLayout'
import { PianoKeyboard } from '@/components/organisms/PianoKeyboard'
import { StepSequencer } from '@/components/organisms/StepSequencer'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { PlayButton } from '@/components/atoms/PlayButton'
import { Slider } from '@/components/ui/slider'
import { Settings, Trash2, Waves } from 'lucide-react'
import { SYNTH_NOTES, type WaveformType } from '@/audio/synth-engine'
import { synthEngine } from '@/audio/synth-engine'
import { cn } from '@/lib/utils'
import type { SequencerPattern, DrumSound } from '@/types/audio.types'

interface SynthPageProps {
  pattern: SequencerPattern
  isPlaying: boolean
  currentStep: number
  bpm: number
  showSequencer: boolean
  selectedStep: number | null
  onPlaySynth: (noteId: string) => void
  onToggle: () => Promise<void>
  onSetBpm: (bpm: number) => void
  onShowSequencerChange: (show: boolean) => void
  onStepSelect: (stepIndex: number) => void
  onToggleSoundOnStep: (soundId: string, stepIndex: number, soundType: 'drum' | 'synth') => void
  onClearSynthTracks: () => void
}

// Convert synth notes to DrumSound format for the sequencer display
const SYNTH_SOUNDS_FOR_DISPLAY: DrumSound[] = SYNTH_NOTES
  .filter(note => !note.isBlackKey) // Only show white keys in sequencer for simplicity
  .map(note => ({
    id: note.id,
    name: note.note,
    url: '', // No URL for synth
    color: '#8b5cf6', // Purple for synth
  }))

const WAVEFORMS: { value: WaveformType; label: string }[] = [
  { value: 'sine', label: 'Sine' },
  { value: 'square', label: 'Square' },
  { value: 'sawtooth', label: 'Saw' },
  { value: 'triangle', label: 'Tri' },
]

export function SynthPage({
  pattern,
  isPlaying,
  currentStep,
  bpm,
  showSequencer,
  selectedStep,
  onPlaySynth,
  onToggle,
  onSetBpm,
  onShowSequencerChange,
  onStepSelect,
  onToggleSoundOnStep,
  onClearSynthTracks,
}: SynthPageProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [waveform, setWaveform] = useState<WaveformType>('sawtooth')

  const handleTrigger = useCallback((noteId: string) => {
    // Always play the sound
    onPlaySynth(noteId)

    // Only add to sequence if: sequencer visible, step selected, and NOT playing
    if (showSequencer && selectedStep !== null && !isPlaying) {
      onToggleSoundOnStep(noteId, selectedStep, 'synth')
    }
  }, [onPlaySynth, showSequencer, selectedStep, isPlaying, onToggleSoundOnStep])

  const handleWaveformChange = useCallback((newWaveform: WaveformType) => {
    setWaveform(newWaveform)
    synthEngine.setWaveform(newWaveform)
  }, [])

  // Filter pattern to only show synth tracks
  const synthPattern: SequencerPattern = {
    ...pattern,
    tracks: pattern.tracks.filter(track => track.soundType === 'synth'),
  }

  return (
    <LandscapeLayout
      header={
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
                onClick={onClearSynthTracks}
                title="Clear synth tracks"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            )}

            {/* Settings button */}
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
      }
    >
      <div className="flex flex-col h-full w-full">
        {/* Settings panel - collapsible */}
        {showSettings && (
          <div className="shrink-0 px-4 py-2 border-b border-border bg-secondary/30">
            <div className="flex items-center gap-6 max-w-lg mx-auto">
              {/* BPM control */}
              {showSequencer && (
                <div className="flex items-center gap-2 flex-1">
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
              )}

              {/* Waveform selector */}
              <div className="flex items-center gap-2">
                <Waves className="w-4 h-4 text-muted-foreground" />
                <div className="flex gap-1">
                  {WAVEFORMS.map(({ value, label }) => (
                    <Button
                      key={value}
                      variant={waveform === value ? 'default' : 'ghost'}
                      size="sm"
                      className="px-2 h-7 text-xs"
                      onClick={() => handleWaveformChange(value)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sequencer - when visible */}
        {showSequencer && synthPattern.tracks.length > 0 && (
          <div className="shrink-0 py-3 border-b border-border">
            <StepSequencer
              pattern={synthPattern}
              sounds={SYNTH_SOUNDS_FOR_DISPLAY}
              selectedStep={selectedStep}
              currentStep={currentStep}
              isPlaying={isPlaying}
              stepCount={16}
              onStepSelect={onStepSelect}
            />
          </div>
        )}

        {/* Message when sequencer is on but no synth tracks yet */}
        {showSequencer && synthPattern.tracks.length === 0 && (
          <div className="shrink-0 py-3 border-b border-border">
            <p className="text-center text-sm text-muted-foreground">
              Select a step below, then tap keys to add notes
            </p>
            <div className="flex justify-center gap-2 mt-2">
              {Array.from({ length: 16 }, (_, i) => (
                <button
                  key={i}
                  className={cn(
                    'w-6 h-6 rounded border transition-all',
                    selectedStep === i
                      ? 'bg-primary border-primary'
                      : 'bg-secondary/50 border-border hover:bg-secondary',
                    isPlaying && currentStep === i && 'ring-2 ring-orange-500',
                  )}
                  onClick={() => onStepSelect(i)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Piano keyboard - flex grow to fill remaining space */}
        <div className="flex-1 flex items-center justify-center min-h-0 p-4">
          <PianoKeyboard onTrigger={handleTrigger} className="w-full max-w-2xl" />
        </div>
      </div>
    </LandscapeLayout>
  )
}
