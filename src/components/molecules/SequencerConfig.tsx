import React from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { STEP_COUNT_OPTIONS } from '@/types/audio.types'
import type { StepCount, SoundDisplay } from '@/types/audio.types'
import { Eye, EyeOff, Volume2 } from 'lucide-react'
import { TapTempoButton } from '@/components/atoms/TapTempoButton'
import { useTapTempo } from '@/hooks/use-tap-tempo'

interface SequencerConfigProps {
  bpm: number
  stepCount: StepCount
  tracks: SoundDisplay[]
  hiddenTracks: Set<string>
  trackVolumes: Map<string, number>
  onBpmChange: (bpm: number) => void
  onStepCountChange: (count: StepCount) => void
  onToggleTrackVisibility: (soundId: string) => void
  onTrackVolumeChange: (soundId: string, volume: number) => void
  className?: string
}

// Custom comparison function to handle Set, Map, and array props
function arePropsEqual(prevProps: SequencerConfigProps, nextProps: SequencerConfigProps): boolean {
  // Check primitive props
  if (
    prevProps.bpm !== nextProps.bpm ||
    prevProps.stepCount !== nextProps.stepCount ||
    prevProps.className !== nextProps.className
  ) {
    return false
  }

  // Check Set equality
  if (prevProps.hiddenTracks.size !== nextProps.hiddenTracks.size) {
    return false
  }
  for (const item of prevProps.hiddenTracks) {
    if (!nextProps.hiddenTracks.has(item)) {
      return false
    }
  }

  // Check Map equality
  if (prevProps.trackVolumes.size !== nextProps.trackVolumes.size) {
    return false
  }
  for (const [key, value] of prevProps.trackVolumes) {
    if (nextProps.trackVolumes.get(key) !== value) {
      return false
    }
  }

  // Check tracks array (shallow comparison by reference is usually enough for this case)
  if (prevProps.tracks !== nextProps.tracks) {
    return false
  }

  // Callbacks are assumed stable (wrapped in useCallback in parent)
  return true
}

export const SequencerConfig = React.memo(function SequencerConfig({
  bpm,
  stepCount,
  tracks,
  hiddenTracks,
  trackVolumes,
  onBpmChange,
  onStepCountChange,
  onToggleTrackVisibility,
  onTrackVolumeChange,
  className,
}: SequencerConfigProps) {
  const { tap } = useTapTempo(onBpmChange)

  // Get visible tracks for volume controls
  const visibleTracks = tracks.filter(track => !hiddenTracks.has(track.id))

  return (
    <div className={cn('space-y-4', className)}>
      {/* BPM Control */}
      <div className="space-y-2">
        <label htmlFor="bpm-slider" className="text-sm text-muted-foreground">BPM</label>
        <div className="flex items-center gap-3">
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
          <TapTempoButton onTap={tap} />
        </div>
      </div>

      {/* Step Count Selector */}
      <div className="space-y-2">
        <span className="text-sm text-muted-foreground">Steps</span>
        <div className="flex gap-1" role="group" aria-label="Step count selector">
          {STEP_COUNT_OPTIONS.map(count => (
            <Button
              key={count}
              variant={stepCount === count ? 'default' : 'outline'}
              size="sm"
              onClick={() => onStepCountChange(count)}
              className="flex-1"
              aria-label={`${count} steps`}
              aria-pressed={stepCount === count}
            >
              {count}
            </Button>
          ))}
        </div>
      </div>

      {/* Track Visibility */}
      <div className="space-y-2">
        <span className="text-sm text-muted-foreground">Tracks</span>
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

      {/* Track Volume Controls */}
      {visibleTracks.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm text-muted-foreground">Volume</span>
          <div className="space-y-2">
            {visibleTracks.map(track => {
              const volume = trackVolumes.get(track.id) ?? 1
              return (
                <div key={track.id} className="flex items-center gap-3">
                  <Volume2 className="w-3 h-3" style={{ color: track.color }} aria-hidden="true" />
                  <span
                    className="text-xs w-12 truncate"
                    style={{ color: track.color }}
                    title={track.name}
                  >
                    {track.name}
                  </span>
                  <Slider
                    value={[volume * 100]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([v]) => onTrackVolumeChange(track.id, v / 100)}
                    className="flex-1"
                    aria-label={`${track.name} volume`}
                  />
                  <span className="text-xs font-mono w-8" aria-live="polite">
                    {Math.round(volume * 100)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}, arePropsEqual)
