import { PianoKey } from '@/components/atoms/PianoKey'
import { SYNTH_NOTES } from '@/audio/synth-engine'
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
  // For our C4-C5 octave, white keys are: C4(0), D4(1), E4(2), F4(3), G4(4), A4(5), B4(6), C5(7)
  // Black keys appear after: C4(0)->C#4, D4(1)->D#4, F4(3)->F#4, G4(4)->G#4, A4(5)->A#4
  const getBlackKeyPosition = (note: string, whiteKeyWidth: number): number => {
    const blackKeyPositions: Record<string, number> = {
      'C#4': 0,  // After C4 (index 0)
      'D#4': 1,  // After D4 (index 1)
      'F#4': 3,  // After F4 (index 3)
      'G#4': 4,  // After G4 (index 4)
      'A#4': 5,  // After A4 (index 5)
    }
    const whiteKeyIndex = blackKeyPositions[note] ?? 0
    // Position it between the white keys (offset by 75% of white key width)
    return whiteKeyIndex * whiteKeyWidth + (whiteKeyWidth * 0.75)
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
      <div className="absolute inset-0 pointer-events-none">
        {blackKeys.map(note => {
          const whiteKeyWidth = 100 / whiteKeys.length
          const leftPosition = getBlackKeyPosition(note.note, whiteKeyWidth)

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
