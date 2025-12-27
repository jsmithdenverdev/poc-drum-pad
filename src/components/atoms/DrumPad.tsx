import React, { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { triggerHaptic } from '@/lib/haptics'

interface DrumPadProps {
  id: string
  name: string
  color: string
  onTrigger: (id: string) => void
  className?: string
}

export const DrumPad = React.memo(function DrumPad({ id, name, color, onTrigger, className }: DrumPadProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  const handleTrigger = useCallback(() => {
    triggerHaptic('light')
    setIsAnimating(true)
    onTrigger(id)
  }, [id, onTrigger])

  const handleAnimationEnd = useCallback(() => {
    setIsAnimating(false)
  }, [])

  return (
    <button
      role="button"
      aria-label={`${name} drum pad`}
      aria-pressed={isAnimating}
      className={cn(
        'relative aspect-square rounded-lg font-bold text-white',
        'flex items-center justify-center',
        'transition-all duration-75 active:scale-95',
        'touch-none select-none',
        'shadow-lg hover:shadow-xl',
        'min-h-[60px] min-w-[60px]',
        isAnimating && 'animate-drum-trigger',
        className
      )}
      style={{
        backgroundColor: color,
        boxShadow: isAnimating ? `0 0 20px ${color}` : undefined,
      }}
      onPointerDown={handleTrigger}
      onAnimationEnd={handleAnimationEnd}
    >
      <span className="text-xs sm:text-sm md:text-base drop-shadow-md">
        {name}
      </span>
    </button>
  )
})
