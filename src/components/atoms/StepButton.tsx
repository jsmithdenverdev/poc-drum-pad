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
  const hasActiveSounds = activeSoundColors.length > 0

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative flex items-center justify-center',
        'w-full aspect-square rounded-lg transition-all duration-75',
        'shadow-inner',
        isBeatStart && 'ring-1 ring-muted-foreground/20',
        isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-95',
        isCurrentStep && 'scale-105',
        className
      )}
      style={{
        background: isCurrentStep
          ? 'radial-gradient(ellipse at 30% 30%, #f97316 0%, #c2410c 50%, #7c2d12 100%)'
          : hasActiveSounds
            ? 'radial-gradient(ellipse at 30% 30%, #6b21a8 0%, #4c1d95 50%, #2e1065 100%)'
            : 'radial-gradient(ellipse at 30% 30%, #3f3f46 0%, #27272a 50%, #18181b 100%)',
        boxShadow: isCurrentStep
          ? 'inset 2px 2px 4px rgba(255,255,255,0.2), inset -2px -2px 4px rgba(0,0,0,0.4), 0 0 12px rgba(249,115,22,0.5)'
          : hasActiveSounds
            ? 'inset 2px 2px 4px rgba(255,255,255,0.15), inset -2px -2px 4px rgba(0,0,0,0.4), 0 0 8px rgba(139,92,246,0.3)'
            : 'inset 2px 2px 4px rgba(255,255,255,0.05), inset -2px -2px 4px rgba(0,0,0,0.3)',
      }}
      aria-label={`Step ${stepIndex + 1}${isSelected ? ', selected' : ''}${activeSoundColors.length > 0 ? `, ${activeSoundColors.length} sounds` : ''}`}
      aria-pressed={isSelected}
    >
      {/* Sound indicators - small dots in a 2x2 grid */}
      {hasActiveSounds && (
        <div className="grid grid-cols-2 gap-0.5">
          {activeSoundColors.slice(0, 4).map((color, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: color,
                boxShadow: `0 0 4px ${color}`,
              }}
            />
          ))}
        </div>
      )}

      {/* Playhead glow effect */}
      {isCurrentStep && (
        <div className="absolute inset-0 rounded-lg animate-pulse bg-accent/20" />
      )}
    </button>
  )
}
