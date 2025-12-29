import { cn } from '@/lib/utils';
import { Plus, VolumeX, Volume2, X, ListPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TimelineTrack } from '@/types/audio.types';

interface TimelineSidebarProps {
  tracks: TimelineTrack[];
  selectedTrackId: string | null;
  trackHeight?: number;
  onTrackSelect: (trackId: string) => void;
  onAddTrack: () => void;
  onDeleteTrack: (trackId: string) => void;
  onToggleMute: (trackId: string) => void;
  onAddPattern?: () => void;
  className?: string;
}

export function TimelineSidebar({
  tracks,
  selectedTrackId,
  trackHeight = 50,
  onTrackSelect,
  onAddTrack,
  onDeleteTrack,
  onToggleMute,
  onAddPattern,
  className,
}: TimelineSidebarProps) {
  return (
    <div
      className={cn(
        'flex w-[60px] flex-col border-r border-border bg-background',
        className
      )}
    >
      {/* Track list */}
      <div className="flex-1 overflow-y-auto">
        {tracks.map((track) => {
          const isSelected = selectedTrackId === track.id

          return (
            <div
              key={track.id}
              className={cn(
                'relative flex w-full border-b border-border transition-colors',
                isSelected && 'bg-secondary'
              )}
              style={{ height: `${trackHeight}px` }}
            >
              <button
                onClick={() => onTrackSelect(track.id)}
                className="flex flex-1 flex-col items-center justify-center gap-0.5 hover:bg-secondary/50"
              >
                {/* Color indicator */}
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: track.color }}
                />

                {/* Track name */}
                <span className="max-w-[50px] truncate text-xs font-medium px-1">
                  {track.name}
                </span>

                {/* Mute button - always visible, styled differently when muted */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleMute(track.id)
                  }}
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded transition-colors',
                    track.muted
                      ? 'text-destructive'
                      : 'text-muted-foreground/50 hover:text-muted-foreground'
                  )}
                  aria-label={track.muted ? 'Unmute track' : 'Mute track'}
                >
                  {track.muted ? (
                    <VolumeX className="h-3 w-3" />
                  ) : (
                    <Volume2 className="h-3 w-3" />
                  )}
                </button>
              </button>

              {/* Delete button - visible when selected */}
              {isSelected && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteTrack(track.id)
                  }}
                  className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive/80 text-destructive-foreground hover:bg-destructive transition-colors"
                  aria-label={`Delete ${track.name}`}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Action buttons */}
      <div className="border-t border-border p-2 space-y-2">
        {/* Add Pattern button - shown when track is selected */}
        {selectedTrackId && onAddPattern && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onAddPattern}
            className="h-8 w-full"
            title="Add pattern to selected track"
          >
            <ListPlus className="h-4 w-4" />
          </Button>
        )}

        {/* Add track button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onAddTrack}
          className="h-8 w-full"
          title="Add new track"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
