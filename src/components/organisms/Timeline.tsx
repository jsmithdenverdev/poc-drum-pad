import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
  onAddPattern?: () => void
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
  onAddPattern,
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

  // Single-track focus mode state - initialize with first track
  const [focusedTrackId, setFocusedTrackId] = useState<string | null>(() =>
    timeline.tracks.length > 0 ? timeline.tracks[0].id : null
  )

  // Find focused track - if focused track doesn't exist, fall back to first track
  const focusedTrack = timeline.tracks.find(t => t.id === focusedTrackId) || timeline.tracks[0]
  const focusedTrackIndex = timeline.tracks.findIndex(t => t.id === (focusedTrack?.id || focusedTrackId))

  // Navigation handlers
  const handlePrevTrack = () => {
    if (focusedTrackIndex > 0) {
      setFocusedTrackId(timeline.tracks[focusedTrackIndex - 1].id)
    }
  }

  const handleNextTrack = () => {
    if (focusedTrackIndex < timeline.tracks.length - 1) {
      setFocusedTrackId(timeline.tracks[focusedTrackIndex + 1].id)
    }
  }

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
      {/* Track Switcher */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-background">
        {/* Previous Track Button */}
        <button
          onClick={handlePrevTrack}
          disabled={focusedTrackIndex <= 0}
          className={cn(
            'p-1 rounded transition-colors',
            focusedTrackIndex > 0
              ? 'hover:bg-secondary text-foreground'
              : 'text-muted-foreground/30 cursor-not-allowed'
          )}
          aria-label="Previous track"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Track Pills */}
        <div className="flex-1 flex gap-1.5 overflow-x-auto">
          {timeline.tracks.map((track) => {
            const isFocused = track.id === focusedTrackId
            return (
              <button
                key={track.id}
                onClick={() => setFocusedTrackId(track.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
                  isFocused
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                )}
              >
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: track.color }}
                />
                <span>{track.name}</span>
              </button>
            )
          })}
        </div>

        {/* Next Track Button */}
        <button
          onClick={handleNextTrack}
          disabled={focusedTrackIndex >= timeline.tracks.length - 1}
          className={cn(
            'p-1 rounded transition-colors',
            focusedTrackIndex < timeline.tracks.length - 1
              ? 'hover:bg-secondary text-foreground'
              : 'text-muted-foreground/30 cursor-not-allowed'
          )}
          aria-label="Next track"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

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

      {/* Main content: sidebar + focused track */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar - only showing focused track */}
        {focusedTrack && (
          <TimelineSidebar
            tracks={[focusedTrack]}
            selectedTrackId={selectedTrackId}
            trackHeight={140}
            onTrackSelect={onTrackSelect}
            onAddTrack={onAddTrack}
            onDeleteTrack={onDeleteTrack}
            onToggleMute={onToggleMute}
            onAddPattern={onAddPattern}
            className="flex-shrink-0"
          />
        )}

        {/* Focused track row - scrollable */}
        <div className="flex-1 overflow-auto">
          {focusedTrack && (
            <div className="relative" style={{ minWidth: `${MEASURE_COUNT * MEASURE_WIDTH}px` }}>
              <TimelineTrackRow
                key={focusedTrack.id}
                track={focusedTrack}
                savedPatterns={savedPatterns}
                measureCount={MEASURE_COUNT}
                measureWidth={MEASURE_WIDTH}
                currentMeasure={currentMeasure}
                isPlaying={isPlaying}
                selectedBlockId={selectedBlockId}
                height={140}
                onCellClick={(measure) => onCellClick(focusedTrack.id, measure)}
                onBlockClick={(block) => onBlockClick(focusedTrack.id, block)}
                onBlockDelete={(blockId) => onBlockDelete(focusedTrack.id, blockId)}
                onBlockMove={(blockId, delta) => onBlockMove(focusedTrack.id, blockId, delta)}
                onBlockResize={onBlockResize ? (blockId, delta) => onBlockResize(focusedTrack.id, blockId, delta) : undefined}
                className="border-b border-border/30"
              />

              {/* Playhead line */}
              {isPlaying && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-primary shadow-[0_0_4px_rgba(var(--primary),0.5)] pointer-events-none z-20"
                  style={{ left: `${playheadX}px` }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
