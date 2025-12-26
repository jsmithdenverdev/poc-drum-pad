import { SequencerTrack } from '@/components/molecules/SequencerTrack'
import type { DrumSound, SequencerPattern } from '@/types/audio.types'
import { cn } from '@/lib/utils'

interface SequencerProps {
  pattern: SequencerPattern
  sounds: DrumSound[]
  currentStep: number
  isPlaying: boolean
  onStepToggle: (trackIndex: number, stepIndex: number) => void
  className?: string
}

export function Sequencer({
  pattern,
  sounds,
  currentStep,
  isPlaying,
  onStepToggle,
  className,
}: SequencerProps) {
  // Create a map for quick sound lookup
  const soundMap = new Map(sounds.map(s => [s.id, s]))

  return (
    <div
      className={cn(
        'flex flex-col gap-1 sm:gap-2 p-2 sm:p-4',
        'w-full max-w-4xl mx-auto',
        'bg-secondary/30 rounded-lg',
        className
      )}
    >
      {/* Step number indicators */}
      <div className="flex items-center gap-1 sm:gap-2 mb-1">
        <div className="w-12 sm:w-16 shrink-0" />
        <div className="flex-1 grid grid-cols-16 gap-0.5 sm:gap-1">
          {Array.from({ length: 16 }, (_, i) => (
            <div
              key={i}
              className={cn(
                'text-center text-[10px] sm:text-xs text-muted-foreground',
                i % 4 === 0 && 'font-bold text-foreground'
              )}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Tracks */}
      {pattern.tracks.map((track, trackIndex) => {
        const sound = soundMap.get(track.soundId)
        if (!sound) return null

        return (
          <SequencerTrack
            key={track.soundId}
            soundId={track.soundId}
            soundName={sound.name}
            color={sound.color}
            steps={track.steps}
            currentStep={currentStep}
            isPlaying={isPlaying}
            onStepToggle={(stepIndex) => onStepToggle(trackIndex, stepIndex)}
          />
        )
      })}
    </div>
  )
}
