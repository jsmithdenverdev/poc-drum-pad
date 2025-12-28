import { useRef } from 'react'
import { cn } from '@/lib/utils'
import { MeasureRuler } from '@/components/atoms/MeasureRuler'
import { TimelineSidebar } from '@/components/molecules/TimelineSidebar'
import { TimelineTrackRow } from '@/components/molecules/TimelineTrackRow'
import type { Timeline as TimelineType, TimelineBlock, SavedPattern } from '@/types/audio.types'

interface TimelineProps {
  timeline: TimelineType
  savedPatterns: SavedPattern[]
  playbackPosition: number
  isPlaying: boolean
  selectedTrackId: string | null
  selectedBlockId: string | null
  onTrackSelect: (trackId: string) => void
  onAddTrack: () => void
  onDeleteTrack: (trackId: string) => void
  onToggleMute: (trackId: string) => void
  onCellClick: (trackId: string, measure: number) => void
  onBlockClick: (trackId: string, block: TimelineBlock) => void
  onBlockDelete: (trackId: string, blockId: string) => void
  onBlockMove: (trackId: string, blockId: string, deltaMeasures: number) => void
  onBlockResize?: (trackId: string, blockId: string, deltaMeasures: number) => void
  className?: string
}

// Configuration
const MEASURE_COUNT = 16
const MEASURE_WIDTH = 40 // pixels per measure

export function Timeline({
  timeline,
  savedPatterns,
  playbackPosition,
  isPlaying,
  selectedTrackId,
  selectedBlockId,
  onTrackSelect,
  onAddTrack,
  onDeleteTrack,
  onToggleMute,
  onCellClick,
  onBlockClick,
  onBlockDelete,
  onBlockMove,
  onBlockResize,
  className,
}: TimelineProps) {
  const currentMeasure = Math.floor(playbackPosition)
  const playheadX = playbackPosition * MEASURE_WIDTH
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const hasTracks = timeline.tracks.length > 0

  // Empty state
  if (!hasTracks) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full p-4 text-center', className)}>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">No tracks yet</p>
          <ol className="text-xs text-muted-foreground/70 space-y-1 text-left">
            <li>1. Create a pattern in Sequencer</li>
            <li>2. Tap 💾 to save it</li>
            <li>3. Come back here and tap + to add a track</li>
          </ol>
          <button
            onClick={onAddTrack}
            className="mt-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            + Add First Track
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header row: sidebar spacer + measure ruler */}
      <div className="flex flex-shrink-0">
        {/* Spacer for sidebar width */}
        <div className="w-[60px] flex-shrink-0 border-r border-border bg-background" />

        {/* Measure ruler - scrollable */}
        <div className="flex-1 overflow-hidden">
          <div
            ref={scrollContainerRef}
            className="overflow-x-auto"
          >
            <MeasureRuler
              measureCount={MEASURE_COUNT}
              measureWidth={MEASURE_WIDTH}
              playbackPosition={playbackPosition}
              isPlaying={isPlaying}
            />
          </div>
        </div>
      </div>

      {/* Main content: sidebar + tracks */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar */}
        <TimelineSidebar
          tracks={timeline.tracks}
          selectedTrackId={selectedTrackId}
          onTrackSelect={onTrackSelect}
          onAddTrack={onAddTrack}
          onDeleteTrack={onDeleteTrack}
          onToggleMute={onToggleMute}
          className="flex-shrink-0"
        />

        {/* Track rows - scrollable */}
        <div className="flex-1 overflow-auto">
          <div className="relative" style={{ minWidth: `${MEASURE_COUNT * MEASURE_WIDTH}px` }}>
            {timeline.tracks.map((track) => (
              <TimelineTrackRow
                key={track.id}
                track={track}
                savedPatterns={savedPatterns}
                measureCount={MEASURE_COUNT}
                measureWidth={MEASURE_WIDTH}
                currentMeasure={currentMeasure}
                isPlaying={isPlaying}
                selectedBlockId={selectedBlockId}
                onCellClick={(measure) => onCellClick(track.id, measure)}
                onBlockClick={(block) => onBlockClick(track.id, block)}
                onBlockDelete={(blockId) => onBlockDelete(track.id, blockId)}
                onBlockMove={(blockId, delta) => onBlockMove(track.id, blockId, delta)}
                onBlockResize={onBlockResize ? (blockId, delta) => onBlockResize(track.id, blockId, delta) : undefined}
                className="border-b border-border/30"
              />
            ))}

            {/* Playhead line extending through all tracks */}
            {isPlaying && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-primary shadow-[0_0_4px_rgba(var(--primary),0.5)] pointer-events-none z-20"
                style={{ left: `${playheadX}px` }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
