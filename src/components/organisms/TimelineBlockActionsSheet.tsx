import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { ChevronLeft, ChevronRight, Minus, Plus, Copy, Trash2 } from 'lucide-react'
import type { TimelineBlock } from '@/types/audio.types'

interface TimelineBlockActionsSheetProps {
  open: boolean
  onClose: () => void
  block: TimelineBlock | null
  trackId: string | null
  patternName?: string
  onMove: (trackId: string, blockId: string, newStartMeasure: number) => void
  onResize: (trackId: string, blockId: string, newLength: number) => void
  onDuplicate: (trackId: string, blockId: string) => void
  onDelete: (trackId: string, blockId: string) => void
}

export function TimelineBlockActionsSheet({
  open,
  onClose,
  block,
  trackId,
  patternName,
  onMove,
  onResize,
  onDuplicate,
  onDelete,
}: TimelineBlockActionsSheetProps) {
  const [localPosition, setLocalPosition] = useState<number>(block?.startMeasure ?? 0)
  const [localLength, setLocalLength] = useState<number>(block?.lengthMeasures ?? 1)

  // Sync local state when block changes
  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (isOpen && block) {
      setLocalPosition(block.startMeasure)
      setLocalLength(block.lengthMeasures)
    } else {
      onClose()
    }
  }, [block, onClose])

  // Move handlers
  const handleMoveLeft = useCallback(() => {
    if (!block || !trackId || localPosition <= 0) return
    const newPosition = Math.max(0, localPosition - 1)
    setLocalPosition(newPosition)
    onMove(trackId, block.id, newPosition)
  }, [block, trackId, localPosition, onMove])

  const handleMoveRight = useCallback(() => {
    if (!block || !trackId) return
    const newPosition = localPosition + 1
    setLocalPosition(newPosition)
    onMove(trackId, block.id, newPosition)
  }, [block, trackId, localPosition, onMove])

  const handlePositionSliderChange = useCallback((value: number[]) => {
    if (!block || !trackId) return
    const newPosition = value[0]
    setLocalPosition(newPosition)
    onMove(trackId, block.id, newPosition)
  }, [block, trackId, onMove])

  // Resize handlers
  const handleLengthDecrease = useCallback(() => {
    if (!block || !trackId || localLength <= 1) return
    const newLength = Math.max(1, localLength - 1)
    setLocalLength(newLength)
    onResize(trackId, block.id, newLength)
  }, [block, trackId, localLength, onResize])

  const handleLengthIncrease = useCallback(() => {
    if (!block || !trackId) return
    const newLength = localLength + 1
    setLocalLength(newLength)
    onResize(trackId, block.id, newLength)
  }, [block, trackId, localLength, onResize])

  const handleLengthSliderChange = useCallback((value: number[]) => {
    if (!block || !trackId) return
    const newLength = value[0]
    setLocalLength(newLength)
    onResize(trackId, block.id, newLength)
  }, [block, trackId, onResize])

  // Action handlers
  const handleDuplicate = useCallback(() => {
    if (!block || !trackId) return
    onDuplicate(trackId, block.id)
    onClose()
  }, [block, trackId, onDuplicate, onClose])

  const handleDelete = useCallback(() => {
    if (!block || !trackId) return
    onDelete(trackId, block.id)
    onClose()
  }, [block, trackId, onDelete, onClose])

  if (!block || !trackId) return null

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="max-h-[80vh] flex flex-col rounded-t-xl">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-lg">Edit Block</SheetTitle>
          <SheetDescription className="text-sm">
            {patternName || 'Pattern'} - {localLength} measure{localLength !== 1 ? 's' : ''} at measure {localPosition + 1}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Position controls */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Position</h3>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleMoveLeft}
                disabled={localPosition <= 0}
                className="h-10 w-10"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <div className="flex-1">
                <Slider
                  value={[localPosition]}
                  onValueChange={handlePositionSliderChange}
                  min={0}
                  max={15}
                  step={1}
                  className="w-full"
                />
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={handleMoveRight}
                className="h-10 w-10"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Measure {localPosition + 1}
            </p>
          </section>

          {/* Length controls */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Length</h3>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleLengthDecrease}
                disabled={localLength <= 1}
                className="h-10 w-10"
              >
                <Minus className="h-5 w-5" />
              </Button>

              <div className="flex-1">
                <Slider
                  value={[localLength]}
                  onValueChange={handleLengthSliderChange}
                  min={1}
                  max={16}
                  step={1}
                  className="w-full"
                />
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={handleLengthIncrease}
                className="h-10 w-10"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              {localLength} measure{localLength !== 1 ? 's' : ''}
            </p>
          </section>

          {/* Action buttons */}
          <section className="space-y-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="lg"
              onClick={handleDuplicate}
              className="w-full justify-start gap-2 h-12"
            >
              <Copy className="h-5 w-5" />
              Duplicate
            </Button>

            <Button
              variant="destructive"
              size="lg"
              onClick={handleDelete}
              className="w-full justify-start gap-2 h-12"
            >
              <Trash2 className="h-5 w-5" />
              Delete
            </Button>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
