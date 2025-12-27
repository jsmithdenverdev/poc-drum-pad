import React from 'react'
import { PlayButton } from '@/components/atoms/PlayButton'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

interface TransportControlsProps {
  isPlaying: boolean
  bpm: number
  onToggle: () => void
  onBpmChange: (bpm: number) => void
  className?: string
}

export const TransportControls = React.memo(function TransportControls({
  isPlaying,
  bpm,
  onToggle,
  onBpmChange,
  className,
}: TransportControlsProps) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <PlayButton isPlaying={isPlaying} onToggle={onToggle} />

      <div className="flex items-center gap-2 flex-1 max-w-[200px]">
        <span className="text-sm text-muted-foreground w-12">BPM</span>
        <Slider
          value={[bpm]}
          min={60}
          max={200}
          step={1}
          onValueChange={([v]) => onBpmChange(v)}
          className="flex-1"
        />
        <span className="text-sm font-mono w-8">{bpm}</span>
      </div>
    </div>
  )
})
