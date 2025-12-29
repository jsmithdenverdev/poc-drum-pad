import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { MeasureRuler } from '@/components/atoms/MeasureRuler'
import { TimelineSidebar } from '@/components/molecules/TimelineSidebar'
import { TimelineTrackRow } from '@/components/molecules/TimelineTrackRow'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
  onBlockDuplicate?: (trackId: string, blockId: string) => void
  onAddPattern?: () => void // Callback for adding pattern to selected track (auto-placement)
  className?: string
}

// Configuration
const MEASURE_COUNT = 16
const MEASURE_WIDTH = 40 // pixels per measure
const FOCUS_MODE_TRACK_HEIGHT = 140 // Tall height for focused track

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
  onBlockDuplicate: _onBlockDuplicate,
  className,
}: TimelineProps) {
  const currentMeasure = Math.floor(playbackPosition)
  const playheadX = playbackPosition * MEASURE_WIDTH
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Focus mode: track which track to show
  const [focusedTrackId, setFocusedTrackId] = useState<string | null>(null)

  const hasTracks = timeline.tracks.length > 0

  // Determine the actual focused track ID, with auto-selection and fallback
  // This is the "source of truth" for which track is focused
  const actualFocusedTrackId = hasTracks
    ? (focusedTrackId && timeline.tracks.find(t => t.id === focusedTrackId)
        ? focusedTrackId // Current focus is valid
        : timeline.tracks[0]?.id ?? null) // Fall back to first track
    : null // No tracks

  // Get the focused track
  const focusedTrack = timeline.tracks.find(t => t.id === actualFocusedTrackId)
  const focusedTrackIndex = timeline.tracks.findIndex(t => t.id === actualFocusedTrackId)

  // Navigation handlers
  const handlePreviousTrack = () => {
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
      {/* Track switcher pills */}
      <div className="flex-shrink-0 px-2 py-2 border-b border-border/30 bg-secondary/20">
        <div className="flex items-center gap-2">
          {/* Previous track button */}
          <button
            onClick={handlePreviousTrack}
            disabled={focusedTrackIndex <= 0}
            className={cn(
              'flex-shrink-0 p-1 rounded-md transition-colors',
              focusedTrackIndex <= 0
                ? 'text-muted-foreground/30 cursor-not-allowed'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            )}
            aria-label="Previous track"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Track pills - scrollable */}
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-2 px-1">
              {timeline.tracks.map((track) => {
                const isFocused = track.id === actualFocusedTrackId
                return (
                  <button
                    key={track.id}
                    onClick={() => setFocusedTrackId(track.id)}
                    className={cn(
                      'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all',
                      'text-xs font-medium',
                      isFocused
                        ? 'bg-primary/20 text-primary ring-2 ring-primary/50'
                        : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
                    )}
                    aria-label={`Switch to ${track.name}`}
                    aria-pressed={isFocused}
                  >
                    <div
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: track.color }}
                    />
                    <span className="whitespace-nowrap">{track.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Next track button */}
          <button
            onClick={handleNextTrack}
            disabled={focusedTrackIndex >= timeline.tracks.length - 1}
            className={cn(
              'flex-shrink-0 p-1 rounded-md transition-colors',
              focusedTrackIndex >= timeline.tracks.length - 1
                ? 'text-muted-foreground/30 cursor-not-allowed'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            )}
            aria-label="Next track"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
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
        {/* Sidebar - showing only focused track */}
        <TimelineSidebar
          tracks={focusedTrack ? [focusedTrack] : []}
          selectedTrackId={selectedTrackId}
          onTrackSelect={onTrackSelect}
          onAddTrack={onAddTrack}
          onDeleteTrack={onDeleteTrack}
          onToggleMute={onToggleMute}
          trackHeight={FOCUS_MODE_TRACK_HEIGHT}
          className="flex-shrink-0"
        />

        {/* Focused track row - scrollable horizontally */}
        <div className="flex-1 overflow-auto">
          {focusedTrack ? (
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
                onCellClick={(measure) => onCellClick(focusedTrack.id, measure)}
                onBlockClick={(block) => onBlockClick(focusedTrack.id, block)}
                onBlockDelete={(blockId) => onBlockDelete(focusedTrack.id, blockId)}
                onBlockMove={(blockId, delta) => onBlockMove(focusedTrack.id, blockId, delta)}
                onBlockResize={onBlockResize ? (blockId, delta) => onBlockResize(focusedTrack.id, blockId, delta) : undefined}
                onBlockDuplicate={onBlockDuplicate ? (blockId) => onBlockDuplicate(focusedTrack.id, blockId) : undefined}
                height={FOCUS_MODE_TRACK_HEIGHT}
              />

              {/* Playhead line extending through the focused track */}
              {isPlaying && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-primary shadow-[0_0_4px_rgba(var(--primary),0.5)] pointer-events-none z-20"
                  style={{ left: `${playheadX}px` }}
                />
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
