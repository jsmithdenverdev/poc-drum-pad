import { PianoKey } from '@/components/atoms/PianoKey'
import { SYNTH_NOTES, type SynthNote } from '@/audio/synth-engine'
import { cn } from '@/lib/utils'

interface PianoKeyboardProps {
  onTrigger: (noteId: string) => void
  className?: string
}

export function PianoKeyboard({ onTrigger, className }: PianoKeyboardProps) {
  // Separate white and black keys for rendering
  const whiteKeys = SYNTH_NOTES.filter(note => !note.isBlackKey)
  const blackKeys = SYNTH_NOTES.filter(note => note.isBlackKey)

  // Get the position of black keys relative to white keys
  // Black keys appear between: C-D, D-E, F-G, G-A, A-B (repeating per octave)
  const getBlackKeyPosition = (note: SynthNote, whiteKeyWidth: number): number => {
    // Map of which white key index each black key follows
    const blackKeyPositions: Record<string, number> = {
      'C#3': 0, 'D#3': 1, 'F#3': 3, 'G#3': 4, 'A#3': 5,
      'C#4': 7, 'D#4': 8, 'F#4': 10, 'G#4': 11, 'A#4': 12,
      'C#5': 14, 'D#5': 15, 'F#5': 17, 'G#5': 18, 'A#5': 19,
    }
    const whiteKeyIndex = blackKeyPositions[note.note] ?? 0
    // Position it between the white keys (offset by 70% of white key width)
    return whiteKeyIndex * whiteKeyWidth + (whiteKeyWidth * 0.7)
  }

  return (
    <div className={cn('relative h-40 flex', className)}>
      {/* White keys */}
      <div className="flex h-full w-full">
        {whiteKeys.map(note => (
          <PianoKey
            key={note.id}
            noteId={note.id}
            note={note.note}
            isBlackKey={false}
            onTrigger={onTrigger}
          />
        ))}
      </div>

      {/* Black keys - absolutely positioned */}
      <div className="absolute inset-0 flex pointer-events-none">
        {blackKeys.map(note => {
          // Calculate position based on note
          const whiteKeyWidth = 100 / whiteKeys.length // percentage
          const leftPosition = getBlackKeyPosition(note, whiteKeyWidth)

          return (
            <div
              key={note.id}
              className="absolute top-0 pointer-events-auto"
              style={{
                left: `${leftPosition}%`,
                transform: 'translateX(-50%)',
                height: '60%',
              }}
            >
              <PianoKey
                noteId={note.id}
                note={note.note}
                isBlackKey={true}
                onTrigger={onTrigger}
                className="h-full w-8"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
