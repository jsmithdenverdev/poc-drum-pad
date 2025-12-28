import React from 'react'
import { Play, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PlayButtonProps {
  isPlaying: boolean
  onToggle: () => void
  className?: string
}

export const PlayButton = React.memo(function PlayButton({ isPlaying, onToggle, className }: PlayButtonProps) {
  return (
    <Button
      variant={isPlaying ? 'destructive' : 'default'}
      size="default"
      onClick={onToggle}
      className={cn(
        'min-w-[88px] rounded-lg font-medium',
        !isPlaying && 'bg-primary/90 hover:bg-primary shadow-md shadow-primary/25',
        className
      )}
      aria-label={isPlaying ? 'Stop playback' : 'Start playback'}
    >
      {isPlaying ? (
        <>
          <Square className="w-3.5 h-3.5 fill-current" />
          Stop
        </>
      ) : (
        <>
          <Play className="w-3.5 h-3.5 fill-current" />
          Play
        </>
      )}
    </Button>
  )
})
