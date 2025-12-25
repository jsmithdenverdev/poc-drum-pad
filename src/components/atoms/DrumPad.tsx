import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface DrumPadProps {
  id: string
  name: string
  color: string
  onTrigger: (id: string) => void
  className?: string
}

export function DrumPad({ id, name, color, onTrigger, className }: DrumPadProps) {
  const [isActive, setIsActive] = useState(false)

  const handleTrigger = useCallback(() => {
    setIsActive(true)
    onTrigger(id)
    setTimeout(() => setIsActive(false), 100)
  }, [id, onTrigger])

  return (
    <button
      className={cn(
        'relative aspect-square rounded-lg font-bold text-white',
        'flex items-center justify-center',
        'transition-all duration-75 active:scale-95',
        'touch-none select-none',
        'shadow-lg hover:shadow-xl',
        'min-h-[60px] min-w-[60px]',
        isActive && 'scale-95 brightness-125',
        className
      )}
      style={{
        backgroundColor: color,
        boxShadow: isActive ? `0 0 20px ${color}` : undefined,
      }}
      onPointerDown={handleTrigger}
    >
      <span className="text-xs sm:text-sm md:text-base drop-shadow-md">
        {name}
      </span>
    </button>
  )
}
