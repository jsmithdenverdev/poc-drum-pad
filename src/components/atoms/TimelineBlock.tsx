import { cn } from '@/lib/utils'
import type { TimelineBlock as TimelineBlockType } from '@/types/audio.types'

interface TimelineBlockProps {
  block: TimelineBlockType
  patternName: string
  color: string
  isSelected: boolean
  onClick: () => void
  className?: string
}

export function TimelineBlock({
  block,
  patternName,
  color,
  isSelected,
  onClick,
  className,
}: TimelineBlockProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full h-full rounded-lg transition-all duration-75',
        'flex items-start justify-start p-1.5',
        'cursor-pointer hover:brightness-110',
        className
      )}
      style={{
        background: `radial-gradient(ellipse at 30% 30%, ${color}dd 0%, ${color}aa 50%, ${color}77 100%)`,
        boxShadow: isSelected
          ? `0 0 0 2px ${color}, 0 0 12px ${color}80, inset 1px 1px 3px rgba(255,255,255,0.2), inset -1px -1px 3px rgba(0,0,0,0.3)`
          : 'inset 1px 1px 3px rgba(255,255,255,0.15), inset -1px -1px 3px rgba(0,0,0,0.3)',
      }}
      aria-label={`${patternName} block, ${block.lengthMeasures} measures at measure ${block.startMeasure + 1}${isSelected ? ', selected' : ''}`}
      aria-pressed={isSelected}
    >
      <span
        className="text-[8px] font-medium text-white/90 leading-tight truncate max-w-full"
        style={{
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
        }}
      >
        {patternName}
      </span>
    </button>
  )
}
