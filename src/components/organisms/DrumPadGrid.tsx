import { DrumPad } from '@/components/atoms/DrumPad'
import type { DrumSound } from '@/types/audio.types'
import { cn } from '@/lib/utils'

interface DrumPadGridProps {
  sounds: DrumSound[]
  onTrigger: (soundId: string) => void
  className?: string
}

export function DrumPadGrid({ sounds, onTrigger, className }: DrumPadGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-4 gap-2 sm:gap-3 md:gap-4 p-2 sm:p-4',
        'w-full max-w-2xl mx-auto',
        className
      )}
    >
      {sounds.map((sound) => (
        <DrumPad
          key={sound.id}
          id={sound.id}
          name={sound.name}
          color={sound.color}
          onTrigger={onTrigger}
        />
      ))}
    </div>
  )
}
