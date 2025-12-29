import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { ChevronLeft, ChevronRight, Plus, Minus, Copy, Trash2 } from 'lucide-react'
import type { TimelineBlock } from '@/types/audio.types'

interface TimelineBlockActionsSheetProps {
  open: boolean
  onClose: () => void
  block: TimelineBlock | null
  trackId: string | null
  patternName?: string
  onMove: (trackId: string, blockId: string, deltaMeasures: number) => void
  onResize: (trackId: string, blockId: string, deltaMeasures: number) => void
  onDuplicate: (trackId: string, blockId: string) => void
  onDelete: (trackId: string, blockId: string) => void
}

export function TimelineBlockActionsSheet({
  open,
  onClose,
  block,
  trackId,
  patternName = 'Unknown Pattern',
  onMove,
  onResize,
  onDuplicate,
  onDelete,
}: TimelineBlockActionsSheetProps) {
  const [localPosition, setLocalPosition] = useState(0)
  const [localLength, setLocalLength] = useState(1)

  // Update local state when block changes
  useEffect(() => {
    if (block) {
      setLocalPosition(block.startMeasure)
      setLocalLength(block.lengthMeasures)
    }
  }, [block])

  if (!block || !trackId) {
    return null
  }

  const handlePositionChange = (value: number[]) => {
    const newPosition = value[0]
    setLocalPosition(newPosition)
    const delta = newPosition - block.startMeasure
    onMove(trackId, block.id, delta)
  }

  const handleLengthChange = (value: number[]) => {
    const newLength = value[0]
    setLocalLength(newLength)
    const delta = newLength - block.lengthMeasures
    onResize(trackId, block.id, delta)
  }

  const handleMoveLeft = () => {
    const newPosition = Math.max(0, localPosition - 1)
    setLocalPosition(newPosition)
    onMove(trackId, block.id, -1)
  }

  const handleMoveRight = () => {
    const newPosition = Math.min(15, localPosition + 1)
    setLocalPosition(newPosition)
    onMove(trackId, block.id, 1)
  }

  const handleShorter = () => {
    const newLength = Math.max(1, localLength - 1)
    setLocalLength(newLength)
    onResize(trackId, block.id, -1)
  }

  const handleLonger = () => {
    const newLength = Math.min(16, localLength + 1)
    setLocalLength(newLength)
    onResize(trackId, block.id, 1)
  }

  const handleDuplicate = () => {
    onDuplicate(trackId, block.id)
    onClose()
  }

  const handleDelete = () => {
    onDelete(trackId, block.id)
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="bottom" className="max-h-[70vh] flex flex-col rounded-t-xl">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-lg">Edit Block</SheetTitle>
          <SheetDescription className="text-sm">
            {patternName} - Position: {localPosition}, Length: {localLength} measure{localLength !== 1 ? 's' : ''}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 py-4">
          {/* Position Controls */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              Position (Measure {localPosition})
            </label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleMoveLeft}
                disabled={localPosition === 0}
                className="flex-shrink-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Slider
                value={[localPosition]}
                onValueChange={handlePositionChange}
                min={0}
                max={15}
                step={1}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleMoveRight}
                disabled={localPosition === 15}
                className="flex-shrink-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Length Controls */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              Length ({localLength} measure{localLength !== 1 ? 's' : ''})
            </label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleShorter}
                disabled={localLength === 1}
                className="flex-shrink-0"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Slider
                value={[localLength]}
                onValueChange={handleLengthChange}
                min={1}
                max={16}
                step={1}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleLonger}
                disabled={localLength === 16}
                className="flex-shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDuplicate}
              className="flex-1"
            >
              <Copy className="h-4 w-4 mr-1" />
              Duplicate
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="flex-1"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
