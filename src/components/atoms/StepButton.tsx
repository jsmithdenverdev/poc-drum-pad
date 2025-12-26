import { cn } from '@/lib/utils'

interface StepButtonProps {
  stepIndex: number
  isSelected: boolean
  isCurrentStep: boolean
  activeSoundColors: string[]
  onSelect: () => void
  className?: string
}

export function StepButton({
  stepIndex,
  isSelected,
  isCurrentStep,
  activeSoundColors,
  onSelect,
  className,
}: StepButtonProps) {
  const isBeatStart = stepIndex % 4 === 0

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative flex flex-col items-center justify-center gap-1',
        'w-full aspect-[3/4] rounded-md transition-all duration-75',
        'bg-secondary hover:bg-secondary/80',
        isBeatStart && 'ring-1 ring-muted-foreground/30',
        isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        isCurrentStep && 'bg-accent/30',
        className
      )}
      aria-label={`Step ${stepIndex + 1}${isSelected ? ', selected' : ''}${activeSoundColors.length > 0 ? `, ${activeSoundColors.length} sounds` : ''}`}
      aria-pressed={isSelected}
    >
      {/* Step number */}
      <span className={cn(
        'text-xs font-medium',
        isSelected ? 'text-primary' : 'text-muted-foreground'
      )}>
        {stepIndex + 1}
      </span>

      {/* Sound indicators */}
      <div className="flex flex-wrap justify-center gap-0.5 px-1 max-w-full">
        {activeSoundColors.slice(0, 4).map((color, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
        ))}
        {activeSoundColors.length > 4 && (
          <span className="text-[8px] text-muted-foreground">
            +{activeSoundColors.length - 4}
          </span>
        )}
      </div>

      {/* Playhead indicator */}
      {isCurrentStep && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-accent" />
      )}
    </button>
  )
}
