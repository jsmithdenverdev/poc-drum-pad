import { Play, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PlayButtonProps {
  isPlaying: boolean
  onToggle: () => void
  className?: string
}

export function PlayButton({ isPlaying, onToggle, className }: PlayButtonProps) {
  return (
    <Button
      variant={isPlaying ? 'destructive' : 'default'}
      size="lg"
      onClick={onToggle}
      className={cn('min-w-[100px]', className)}
    >
      {isPlaying ? (
        <>
          <Square className="w-4 h-4 fill-current" />
          Stop
        </>
      ) : (
        <>
          <Play className="w-4 h-4 fill-current" />
          Play
        </>
      )}
    </Button>
  )
}
