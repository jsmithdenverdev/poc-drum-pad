import { StepButton } from '@/components/atoms/StepButton'
import type { DrumSound, SequencerPattern } from '@/types/audio.types'
import { cn } from '@/lib/utils'

interface StepSequencerProps {
  pattern: SequencerPattern
  sounds: DrumSound[]
  selectedStep: number | null
  currentStep: number
  isPlaying: boolean
  onStepSelect: (stepIndex: number) => void
  className?: string
}

export function StepSequencer({
  pattern,
  sounds,
  selectedStep,
  currentStep,
  isPlaying,
  onStepSelect,
  className,
}: StepSequencerProps) {
  // Create a map for quick sound color lookup
  const soundColorMap = new Map(sounds.map(s => [s.id, s.color]))

  // Get active sound colors for each step
  const getActiveSoundsForStep = (stepIndex: number): string[] => {
    const colors: string[] = []
    pattern.tracks.forEach(track => {
      if (track.steps[stepIndex]?.active) {
        const color = soundColorMap.get(track.soundId)
        if (color) colors.push(color)
      }
    })
    return colors
  }

  const steps = Array.from({ length: 16 }, (_, i) => i)

  return (
    <div className={cn('w-full max-w-2xl mx-auto px-2', className)}>
      {/* Four rows of 4 steps each */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {steps.map(stepIndex => (
          <StepButton
            key={stepIndex}
            stepIndex={stepIndex}
            isSelected={selectedStep === stepIndex}
            isCurrentStep={isPlaying && currentStep === stepIndex}
            activeSoundColors={getActiveSoundsForStep(stepIndex)}
            onSelect={() => onStepSelect(stepIndex)}
          />
        ))}
      </div>
    </div>
  )
}
