import { useMemo } from 'react'
import { StepButton } from '@/components/atoms/StepButton'
import type { SoundDisplay, SequencerPattern, StepCount } from '@/types/audio.types'
import { cn } from '@/lib/utils'

interface StepSequencerProps {
  pattern: SequencerPattern
  sounds: SoundDisplay[]
  selectedStep: number | null
  currentStep: number
  isPlaying: boolean
  stepCount: StepCount
  hiddenTracks?: Set<string>
  onStepSelect: (stepIndex: number) => void
  className?: string
}

export function StepSequencer({
  pattern,
  sounds,
  selectedStep,
  currentStep,
  isPlaying,
  stepCount,
  hiddenTracks = new Set(),
  onStepSelect,
  className,
}: StepSequencerProps) {
  // Memoize sound color map for quick lookup
  const soundColorMap = useMemo(
    () => new Map(sounds.map(s => [s.id, s.color])),
    [sounds]
  )

  // Precompute all step colors once per pattern change
  const stepColors = useMemo(() => {
    return Array.from({ length: stepCount }, (_, stepIndex) => {
      const colors: string[] = []
      pattern.tracks.forEach(track => {
        if (track.steps[stepIndex]?.active && !hiddenTracks.has(track.soundId)) {
          const color = soundColorMap.get(track.soundId)
          if (color) colors.push(color)
        }
      })
      return colors
    })
  }, [pattern.tracks, stepCount, hiddenTracks, soundColorMap])

  const steps = Array.from({ length: stepCount }, (_, i) => i)

  // Determine grid columns based on step count
  const gridColsClass = {
    4: 'grid-cols-4',
    8: 'grid-cols-4',
    16: 'grid-cols-4',
    32: 'grid-cols-8',
  }[stepCount]

  // Adjust max-width based on step count
  const maxWidthClass = stepCount === 32 ? 'max-w-lg' : 'max-w-xs'

  return (
    <div className={cn('w-full mx-auto px-2', maxWidthClass, className)}>
      <div className={cn('grid gap-2', gridColsClass)}>
        {steps.map(stepIndex => (
          <StepButton
            key={stepIndex}
            stepIndex={stepIndex}
            isSelected={selectedStep === stepIndex}
            isCurrentStep={isPlaying && currentStep === stepIndex}
            activeSoundColors={stepColors[stepIndex]}
            onSelect={() => onStepSelect(stepIndex)}
          />
        ))}
      </div>
    </div>
  )
}
