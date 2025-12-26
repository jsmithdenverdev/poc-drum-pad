import { cn } from '@/lib/utils'

interface SequencerStepProps {
  active: boolean
  isCurrentStep: boolean
  color: string
  stepIndex: number
  onToggle: () => void
  className?: string
}

export function SequencerStep({
  active,
  isCurrentStep,
  color,
  stepIndex,
  onToggle,
  className,
}: SequencerStepProps) {
  // Highlight every 4th step (beat markers)
  const isBeatStart = stepIndex % 4 === 0

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'w-full aspect-square rounded-sm transition-all duration-75',
        'min-w-[24px] min-h-[24px]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isBeatStart ? 'ring-1 ring-muted-foreground/20' : '',
        isCurrentStep && 'ring-2 ring-accent ring-offset-1 ring-offset-background',
        className
      )}
      style={{
        backgroundColor: active ? color : 'hsl(var(--muted))',
        opacity: active ? 1 : 0.4,
      }}
      aria-label={`Step ${stepIndex + 1}, ${active ? 'active' : 'inactive'}`}
      aria-pressed={active}
    />
  )
}
