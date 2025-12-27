import { useState, useEffect } from 'react'
import { Music } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TapTempoButtonProps {
  onTap: () => void
  className?: string
}

export function TapTempoButton({ onTap, className }: TapTempoButtonProps) {
  const [isActive, setIsActive] = useState(false)

  const handleTap = () => {
    onTap()
    setIsActive(true)
  }

  // Reset visual feedback after animation
  useEffect(() => {
    if (isActive) {
      const timeout = setTimeout(() => setIsActive(false), 150)
      return () => clearTimeout(timeout)
    }
  }, [isActive])

  return (
    <Button
      variant="outline"
      size="sm"
      onPointerDown={handleTap}
      className={cn(
        'transition-all duration-150',
        isActive && 'scale-95 bg-primary/20 border-primary',
        className
      )}
      aria-label="Tap to set tempo"
    >
      <Music className="w-3 h-3" aria-hidden="true" />
      Tap
    </Button>
  )
}
