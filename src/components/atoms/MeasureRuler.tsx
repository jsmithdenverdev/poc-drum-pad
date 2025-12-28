import { cn } from '@/lib/utils';

interface MeasureRulerProps {
  measureCount: number;
  measureWidth: number;
  currentMeasure: number;
  isPlaying: boolean;
  className?: string;
}

export function MeasureRuler({
  measureCount,
  measureWidth,
  currentMeasure,
  isPlaying,
  className,
}: MeasureRulerProps) {
  return (
    <div className={cn('relative flex h-5 border-b border-border', className)}>
      {Array.from({ length: measureCount }, (_, i) => {
        const measureNumber = i + 1;
        const isBarMarker = measureNumber % 4 === 0;
        const isPlayhead = isPlaying && i === currentMeasure;

        return (
          <div
            key={i}
            className={cn(
              'flex items-center justify-center border-r border-border text-[10px] transition-colors',
              isBarMarker ? 'font-semibold text-foreground/70' : 'text-muted-foreground',
              isPlayhead && 'bg-primary/10',
            )}
            style={{ width: `${measureWidth}px` }}
          >
            {measureNumber}
          </div>
        );
      })}
    </div>
  );
}
