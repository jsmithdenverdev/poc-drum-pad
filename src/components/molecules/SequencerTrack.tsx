import { SequencerStep } from '@/components/atoms/SequencerStep'
import type { SequencerStep as SequencerStepType } from '@/types/audio.types'
import { cn } from '@/lib/utils'

interface SequencerTrackProps {
  soundId: string
  soundName: string
  color: string
  steps: SequencerStepType[]
  currentStep: number
  isPlaying: boolean
  onStepToggle: (stepIndex: number) => void
  className?: string
}

export function SequencerTrack({
  soundName,
  color,
  steps,
  currentStep,
  isPlaying,
  onStepToggle,
  className,
}: SequencerTrackProps) {
  return (
    <div className={cn('flex items-center gap-1 sm:gap-2', className)}>
      <div
        className="w-12 sm:w-16 text-xs sm:text-sm font-medium truncate shrink-0"
        style={{ color }}
      >
        {soundName}
      </div>
      <div className="flex-1 grid grid-cols-16 gap-0.5 sm:gap-1">
        {steps.map((step, index) => (
          <SequencerStep
            key={index}
            active={step.active}
            isCurrentStep={isPlaying && currentStep === index}
            color={color}
            stepIndex={index}
            onToggle={() => onStepToggle(index)}
          />
        ))}
      </div>
    </div>
  )
}
