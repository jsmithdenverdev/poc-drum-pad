import React, { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { triggerHaptic } from '@/lib/haptics'

interface PianoKeyProps {
  noteId: string
  note: string
  isBlackKey: boolean
  onTrigger?: (noteId: string) => void
  onNoteOn?: (noteId: string) => void
  onNoteOff?: (noteId: string) => void
  className?: string
}

export const PianoKey = React.memo(function PianoKey({ noteId, note, isBlackKey, onTrigger, onNoteOn, onNoteOff, className }: PianoKeyProps) {
  const [isActive, setIsActive] = useState(false)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    triggerHaptic('light')
    setIsActive(true)

    // Use noteOn if provided (for sustained notes), otherwise use onTrigger (for one-shot)
    if (onNoteOn) {
      onNoteOn(noteId)
    } else if (onTrigger) {
      onTrigger(noteId)
    }
  }, [noteId, onTrigger, onNoteOn])

  const handlePointerUp = useCallback(() => {
    setIsActive(false)

    // Call noteOff if provided (for sustained notes)
    if (onNoteOff) {
      onNoteOff(noteId)
    }
  }, [noteId, onNoteOff])

  const handlePointerLeave = useCallback(() => {
    setIsActive(false)

    // Call noteOff if provided (in case pointer leaves while held)
    if (onNoteOff) {
      onNoteOff(noteId)
    }
  }, [noteId, onNoteOff])

  // Get the note name without octave for display
  const displayNote = note.replace(/\d/, '')

  return (
    <button
      role="button"
      aria-label={`Piano key ${note}`}
      aria-pressed={isActive}
      className={cn(
        'relative select-none touch-none transition-all duration-75',
        isBlackKey ? [
          // Black key styles
          'bg-zinc-900 border border-zinc-700',
          'h-[60%] w-8 -mx-4 z-10',
          'rounded-b-md',
          'shadow-lg',
          isActive && 'bg-zinc-700 scale-95 shadow-md',
        ] : [
          // White key styles
          'bg-white border border-zinc-300',
          'h-full flex-1 min-w-10',
          'rounded-b-lg',
          'shadow-md',
          isActive && 'bg-zinc-200 scale-[0.98] shadow-sm',
        ],
        className,
      )}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerUp}
    >
      {/* Note label - only on white keys */}
      {!isBlackKey && (
        <span className={cn(
          'absolute bottom-2 left-1/2 -translate-x-1/2',
          'text-xs font-medium text-zinc-500',
          isActive && 'text-zinc-700',
        )}>
          {displayNote}
        </span>
      )}
    </button>
  )
})
