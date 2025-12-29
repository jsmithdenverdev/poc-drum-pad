import { cn } from '@/lib/utils';

interface MeasureRulerProps {
  measureCount: number;
  measureWidth: number;
  playbackPosition: number;
  isPlaying: boolean;
  className?: string;
}

export function MeasureRuler({
  measureCount,
  measureWidth,
  playbackPosition,
  isPlaying,
  className,
}: MeasureRulerProps) {
  // Calculate playhead position in pixels
  const playheadX = playbackPosition * measureWidth;

  return (
    <div className={cn('relative flex h-5 border-b border-border', className)}>
      {Array.from({ length: measureCount }, (_, i) => {
        const measureNumber = i + 1;
        const isBarMarker = measureNumber % 4 === 0;

        return (
          <div
            key={i}
            className={cn(
              'flex items-center justify-center border-r border-border text-[10px]',
              isBarMarker ? 'font-semibold text-foreground/70' : 'text-muted-foreground',
            )}
            style={{ width: `${measureWidth}px` }}
          >
            {measureNumber}
          </div>
        );
      })}

      {/* Smooth playhead line */}
      {isPlaying && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-primary shadow-[0_0_4px_rgba(var(--primary),0.5)] pointer-events-none z-10"
          style={{ left: `${playheadX}px` }}
        />
      )}
    </div>
  );
}
