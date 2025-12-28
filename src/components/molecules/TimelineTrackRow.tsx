import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { TimelineBlock } from '@/components/atoms/TimelineBlock'
import type { TimelineTrack, TimelineBlock as TimelineBlockType, SavedPattern } from '@/types/audio.types'

interface TimelineTrackRowProps {
  track: TimelineTrack
  savedPatterns: SavedPattern[]
  measureCount: number
  measureWidth: number
  currentMeasure: number
  isPlaying: boolean
  selectedBlockId: string | null
  onCellClick: (measure: number) => void
  onBlockClick: (block: TimelineBlockType) => void
  onBlockDelete: (blockId: string) => void
  className?: string
}

export function TimelineTrackRow({
  track,
  savedPatterns,
  measureCount,
  measureWidth,
  currentMeasure,
  isPlaying,
  selectedBlockId,
  onCellClick,
  onBlockClick,
  onBlockDelete,
  className,
}: TimelineTrackRowProps) {
  // Create array of measure indices
  const measures = useMemo(() => Array.from({ length: measureCount }, (_, i) => i), [measureCount])

  // Get pattern name by ID
  const getPatternName = (patternId: string): string => {
    const pattern = savedPatterns.find(p => p.id === patternId)
    return pattern?.name || 'Unknown'
  }

  return (
    <div
      className={cn('relative flex', className)}
      style={{ height: '50px' }}
    >
      {/* Grid cells - clickable empty spaces */}
      <div className="absolute inset-0 flex">
        {measures.map((measure) => {
          const isBarLine = measure % 4 === 0
          const isCurrent = isPlaying && currentMeasure === measure

          return (
            <button
              key={measure}
              type="button"
              onClick={() => onCellClick(measure)}
              className={cn(
                'border-r border-border/30 transition-colors relative',
                isBarLine && 'border-r-border/60',
                isCurrent && 'bg-primary/10',
                !isCurrent && (isBarLine ? 'bg-muted/20' : 'bg-background'),
                'hover:bg-muted/40'
              )}
              style={{ width: `${measureWidth}px` }}
              aria-label={`Track ${track.name}, measure ${measure + 1}`}
            >
              {/* Current measure indicator */}
              {isCurrent && (
                <div className="absolute inset-y-0 left-0 w-0.5 bg-primary animate-pulse" />
              )}
            </button>
          )
        })}
      </div>

      {/* Blocks layer - absolutely positioned on top */}
      <div className="absolute inset-0 pointer-events-none">
        {track.blocks.map((block) => {
          const patternName = getPatternName(block.patternId)
          const isSelected = block.id === selectedBlockId
          const left = block.startMeasure * measureWidth
          const width = block.lengthMeasures * measureWidth

          return (
            <div
              key={block.id}
              className="absolute pointer-events-auto"
              style={{
                left: `${left}px`,
                width: `${width}px`,
                top: '4px',
                bottom: '4px',
              }}
            >
              <TimelineBlock
                block={block}
                patternName={patternName}
                color={track.color}
                isSelected={isSelected}
                onClick={() => onBlockClick(block)}
                onDelete={() => onBlockDelete(block.id)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
