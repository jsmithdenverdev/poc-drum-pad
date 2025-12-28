import { useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { triggerHaptic } from '@/lib/haptics'
import type { Timeline, TimelineBlock, SavedPattern } from '@/types/audio.types'

interface TimelineProps {
  timeline: Timeline
  savedPatterns: SavedPattern[]
  currentMeasure: number
  isPlaying: boolean
  selectedMeasure: number | null
  onMeasureSelect: (measure: number) => void
  onBlockSelect?: (block: TimelineBlock) => void
  className?: string
}

// Number of measures to display
const VISIBLE_MEASURES = 16

export function Timeline({
  timeline,
  savedPatterns,
  currentMeasure,
  isPlaying,
  selectedMeasure,
  onMeasureSelect,
  onBlockSelect,
  className,
}: TimelineProps) {
  // Create a map of pattern colors for quick lookup
  const patternColorMap = useMemo(() => {
    const colors = [
      '#ef4444', // red
      '#f97316', // orange
      '#eab308', // yellow
      '#22c55e', // green
      '#06b6d4', // cyan
      '#3b82f6', // blue
      '#8b5cf6', // violet
      '#ec4899', // pink
    ]
    const map = new Map<string, string>()
    savedPatterns.forEach((pattern, index) => {
      map.set(pattern.id, colors[index % colors.length])
    })
    return map
  }, [savedPatterns])

  // Find block at a given measure
  const getBlockAtMeasure = useCallback((measure: number): TimelineBlock | undefined => {
    return timeline.blocks.find(
      block => measure >= block.startMeasure && measure < block.startMeasure + block.lengthMeasures
    )
  }, [timeline.blocks])

  // Get pattern name by ID
  const getPatternName = useCallback((patternId: string): string => {
    const pattern = savedPatterns.find(p => p.id === patternId)
    return pattern?.name || 'Unknown'
  }, [savedPatterns])

  const measures = Array.from({ length: VISIBLE_MEASURES }, (_, i) => i)

  const handleMeasureClick = useCallback((measure: number) => {
    triggerHaptic('light')
    onMeasureSelect(measure)
    const block = getBlockAtMeasure(measure)
    if (block && onBlockSelect) {
      onBlockSelect(block)
    }
  }, [onMeasureSelect, getBlockAtMeasure, onBlockSelect])

  return (
    <div className={cn('w-full mx-auto px-2 max-w-lg', className)}>
      {/* Timeline header with measure numbers */}
      <div className="flex gap-1 mb-1 px-0.5">
        {measures.map(measure => (
          <div
            key={measure}
            className={cn(
              'flex-1 text-center text-[10px] font-mono',
              measure % 4 === 0 ? 'text-muted-foreground' : 'text-muted-foreground/40'
            )}
          >
            {measure + 1}
          </div>
        ))}
      </div>

      {/* Timeline grid */}
      <div className="grid grid-cols-16 gap-1">
        {measures.map(measure => {
          const block = getBlockAtMeasure(measure)
          const isBlockStart = block?.startMeasure === measure
          const isCurrent = isPlaying && currentMeasure === measure
          const isSelected = selectedMeasure === measure
          const hasBlock = !!block
          const blockColor = block ? patternColorMap.get(block.patternId) : undefined
          const isBeatStart = measure % 4 === 0

          return (
            <button
              key={measure}
              type="button"
              onClick={() => handleMeasureClick(measure)}
              className={cn(
                'relative flex items-center justify-center',
                'w-full aspect-[1/2] rounded transition-all duration-75',
                isBeatStart && 'ring-1 ring-muted-foreground/20',
              )}
              style={{
                background: isCurrent
                  ? 'radial-gradient(ellipse at 30% 30%, #22d3ee 0%, #0891b2 50%, #164e63 100%)'
                  : hasBlock
                    ? `radial-gradient(ellipse at 30% 30%, ${blockColor}cc 0%, ${blockColor}99 50%, ${blockColor}66 100%)`
                    : 'radial-gradient(ellipse at 30% 30%, #27272a 0%, #1a1a1f 50%, #0c0c0f 100%)',
                boxShadow: isSelected
                  ? '0 0 0 2px #818cf8, 0 0 12px rgba(129,140,248,0.5)'
                  : isCurrent
                    ? '0 0 10px rgba(34,211,238,0.4)'
                    : hasBlock
                      ? `0 0 6px ${blockColor}40`
                      : 'inset 1px 1px 2px rgba(255,255,255,0.03), inset -1px -1px 2px rgba(0,0,0,0.2)',
              }}
              aria-label={`Measure ${measure + 1}${isSelected ? ', selected' : ''}${hasBlock ? `, pattern: ${getPatternName(block.patternId)}` : ''}`}
              aria-pressed={isSelected}
            >
              {/* Pattern name on block start */}
              {isBlockStart && block && (
                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-medium text-white/90 truncate px-0.5">
                  {getPatternName(block.patternId).slice(0, 3)}
                </span>
              )}

              {/* Playhead indicator */}
              {isCurrent && (
                <div className="absolute inset-0 rounded animate-pulse bg-accent/20" />
              )}
            </button>
          )
        })}
      </div>

      {/* Legend / Help text */}
      <div className="mt-2 flex items-center justify-center gap-4 text-[10px] text-muted-foreground/60">
        <span>Tap to select • Drag patterns to arrange</span>
      </div>
    </div>
  )
}
