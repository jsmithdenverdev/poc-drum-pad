import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Music, X } from 'lucide-react'
import type { SavedPattern } from '@/types/audio.types'

interface PatternPickerModalProps {
  open: boolean
  onClose: () => void
  onSelectPattern: (pattern: SavedPattern) => void
  savedPatterns: SavedPattern[]
  trackName?: string
  measureNumber?: number
}

export function PatternPickerModal({
  open,
  onClose,
  onSelectPattern,
  savedPatterns,
  trackName,
  measureNumber,
}: PatternPickerModalProps) {
  const hasPatterns = savedPatterns.length > 0

  return (
    <Sheet open={open} onOpenChange={(isOpen: boolean) => !isOpen && onClose()}>
      <SheetContent side="bottom" className="max-h-[70vh] flex flex-col rounded-t-xl">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-lg">Add Pattern</SheetTitle>
          <SheetDescription className="text-sm">
            {trackName && measureNumber !== undefined
              ? `${trackName} at measure ${measureNumber + 1}`
              : 'Select a pattern to add'}
          </SheetDescription>
        </SheetHeader>

        {hasPatterns ? (
          <div className="flex-1 overflow-y-auto py-2">
            <div className="grid gap-2">
              {savedPatterns.map((pattern) => (
                <button
                  key={pattern.id}
                  onClick={() => onSelectPattern(pattern)}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border border-border',
                    'bg-secondary/30 hover:bg-secondary/60 transition-colors',
                    'text-left w-full'
                  )}
                >
                  {/* Pattern icon/color */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                    <Music className="h-5 w-5 text-primary" />
                  </div>

                  {/* Pattern info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {pattern.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pattern.bpm} BPM • {pattern.tracks.length} sounds
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
              <Music className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No saved patterns</p>
            <p className="text-xs text-muted-foreground mt-1">
              Create a pattern in the Sequencer and tap the save icon
            </p>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-border">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
