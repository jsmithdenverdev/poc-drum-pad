import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { STEP_COUNT_OPTIONS } from '@/types/audio.types'
import type { StepCount, DrumSound } from '@/types/audio.types'
import { Eye, EyeOff } from 'lucide-react'

interface SequencerConfigProps {
  bpm: number
  stepCount: StepCount
  tracks: DrumSound[]
  hiddenTracks: Set<string>
  onBpmChange: (bpm: number) => void
  onStepCountChange: (count: StepCount) => void
  onToggleTrackVisibility: (soundId: string) => void
  className?: string
}

export function SequencerConfig({
  bpm,
  stepCount,
  tracks,
  hiddenTracks,
  onBpmChange,
  onStepCountChange,
  onToggleTrackVisibility,
  className,
}: SequencerConfigProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* BPM Control */}
      <div className="flex items-center gap-4">
        <label htmlFor="bpm-slider" className="text-sm text-muted-foreground w-12">BPM</label>
        <Slider
          value={[bpm]}
          min={60}
          max={200}
          step={1}
          onValueChange={([v]) => onBpmChange(v)}
          className="flex-1"
          aria-label="Tempo in beats per minute"
        />
        <span className="text-sm font-mono w-8" aria-live="polite">{bpm}</span>
      </div>

      {/* Step Count Selector */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground w-12">Steps</span>
        <div className="flex gap-1" role="group" aria-label="Step count selector">
          {STEP_COUNT_OPTIONS.map(count => (
            <Button
              key={count}
              variant={stepCount === count ? 'default' : 'outline'}
              size="sm"
              onClick={() => onStepCountChange(count)}
              className="w-10"
              aria-label={`${count} steps`}
              aria-pressed={stepCount === count}
            >
              {count}
            </Button>
          ))}
        </div>
      </div>

      {/* Track Visibility */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground w-12">Tracks</span>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Track visibility controls">
          {tracks.map(track => {
            const isHidden = hiddenTracks.has(track.id)
            return (
              <Button
                key={track.id}
                variant="outline"
                size="sm"
                onClick={() => onToggleTrackVisibility(track.id)}
                className={cn(
                  'h-7 px-2 text-xs gap-1',
                  isHidden && 'opacity-50'
                )}
                style={{
                  borderColor: isHidden ? undefined : track.color,
                  color: isHidden ? undefined : track.color,
                }}
                aria-label={`${isHidden ? 'Show' : 'Hide'} ${track.name} track`}
                aria-pressed={!isHidden}
              >
                {isHidden ? (
                  <EyeOff className="w-3 h-3" aria-hidden="true" />
                ) : (
                  <Eye className="w-3 h-3" aria-hidden="true" />
                )}
                {track.name}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
