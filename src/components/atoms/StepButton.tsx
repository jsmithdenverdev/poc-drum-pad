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
          ? 'radial-gradient(ellipse at 30% 30%, #f97316 0%, #c2410c 50%, #7c2d12 100%)'
          : hasActiveSounds
            ? 'radial-gradient(ellipse at 30% 30%, #6b21a8 0%, #4c1d95 50%, #2e1065 100%)'
            : 'radial-gradient(ellipse at 30% 30%, #3f3f46 0%, #27272a 50%, #18181b 100%)',
        boxShadow: isSelected
          ? '0 0 0 3px #8b5cf6, 0 0 16px rgba(139,92,246,0.6), inset 2px 2px 4px rgba(255,255,255,0.1), inset -2px -2px 4px rgba(0,0,0,0.3)'
          : isCurrentStep
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
})
