import { cn } from '@/lib/utils';
import { Plus, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TimelineTrack } from '@/types/audio.types';

interface TimelineSidebarProps {
  tracks: TimelineTrack[];
  selectedTrackId: string | null;
  onTrackSelect: (trackId: string) => void;
  onAddTrack: () => void;
  className?: string;
}

export function TimelineSidebar({
  tracks,
  selectedTrackId,
  onTrackSelect,
  onAddTrack,
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
        {tracks.map((track) => (
          <button
            key={track.id}
            onClick={() => onTrackSelect(track.id)}
            className={cn(
              'flex h-[50px] w-full flex-col items-center justify-center gap-1 border-b border-border transition-colors hover:bg-secondary/50',
              selectedTrackId === track.id && 'bg-secondary'
            )}
          >
            {/* Color indicator */}
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: track.color }}
            />

            {/* Track name */}
            <div className="flex w-full items-center justify-center gap-1 px-1">
              <span className="max-w-[40px] truncate text-xs font-medium">
                {track.name}
              </span>
              {track.muted && (
                <VolumeX className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Add track button */}
      <div className="border-t border-border p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onAddTrack}
          className="h-8 w-full"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
