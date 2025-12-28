import React from 'react'
import { Play, Pause } from 'lucide-react'
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
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className={cn(
        'rounded-lg h-8 w-8',
        isPlaying
          ? 'text-amber-500 hover:text-amber-400 hover:bg-amber-500/10'
          : 'text-green-500 hover:text-green-400 hover:bg-green-500/10',
        className
      )}
      aria-label={isPlaying ? 'Pause playback' : 'Start playback'}
    >
      {isPlaying ? (
        <Pause className="w-4 h-4 fill-current" />
      ) : (
        <Play className="w-4 h-4 fill-current" />
      )}
    </Button>
  )
})
