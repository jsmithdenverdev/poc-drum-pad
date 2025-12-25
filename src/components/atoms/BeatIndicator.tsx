import { cn } from '@/lib/utils'

interface BeatIndicatorProps {
  active: boolean
  isCurrentStep?: boolean
  className?: string
}

export function BeatIndicator({ active, isCurrentStep, className }: BeatIndicatorProps) {
  return (
    <div
      className={cn(
        'w-3 h-3 rounded-full transition-all duration-75',
        active ? 'bg-primary' : 'bg-muted',
        isCurrentStep && 'ring-2 ring-accent ring-offset-1 ring-offset-background',
        className
      )}
    />
  )
}
