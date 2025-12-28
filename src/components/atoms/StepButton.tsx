import React, { useCallback } from 'react'
import { cn } from '@/lib/utils'
import { triggerHaptic } from '@/lib/haptics'

interface StepButtonProps {
  stepIndex: number
  isSelected: boolean
  isCurrentStep: boolean
  activeSoundColors: string[]
  onSelect: () => void
  className?: string
}

export const StepButton = React.memo(function StepButton({
  stepIndex,
  isSelected,
  isCurrentStep,
  activeSoundColors,
  onSelect,
  className,
}: StepButtonProps) {
  const isBeatStart = stepIndex % 4 === 0
  const hasActiveSounds = activeSoundColors.length > 0

  const handleClick = useCallback(() => {
    triggerHaptic('light')
    onSelect()
  }, [onSelect])

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'relative flex items-center justify-center',
        'w-full aspect-square rounded-lg transition-all duration-75',
        isBeatStart && 'ring-1 ring-muted-foreground/20',
        className
      )}
      style={{
        background: isCurrentStep
          ? 'radial-gradient(ellipse at 30% 30%, #22d3ee 0%, #0891b2 50%, #164e63 100%)'
          : hasActiveSounds
            ? 'radial-gradient(ellipse at 30% 30%, #6366f1 0%, #4f46e5 50%, #312e81 100%)'
            : 'radial-gradient(ellipse at 30% 30%, #27272a 0%, #1a1a1f 50%, #0c0c0f 100%)',
        boxShadow: isSelected
          ? '0 0 0 2px #818cf8, 0 0 12px rgba(129,140,248,0.5), inset 1px 1px 3px rgba(255,255,255,0.1), inset -1px -1px 3px rgba(0,0,0,0.2)'
          : isCurrentStep
            ? 'inset 1px 1px 3px rgba(255,255,255,0.2), inset -1px -1px 3px rgba(0,0,0,0.3), 0 0 10px rgba(34,211,238,0.4)'
            : hasActiveSounds
              ? 'inset 1px 1px 3px rgba(255,255,255,0.1), inset -1px -1px 3px rgba(0,0,0,0.3), 0 0 6px rgba(99,102,241,0.25)'
              : 'inset 1px 1px 2px rgba(255,255,255,0.03), inset -1px -1px 2px rgba(0,0,0,0.2)',
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
})
