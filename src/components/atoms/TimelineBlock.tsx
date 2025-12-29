import { useState, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { X, GripVertical } from 'lucide-react'
import type { TimelineBlock as TimelineBlockType } from '@/types/audio.types'

interface TimelineBlockProps {
  block: TimelineBlockType
  patternName: string
  color: string
  isSelected: boolean
  measureWidth: number
  onClick: () => void
  onDelete?: () => void
  onMove?: (deltaMeasures: number) => void
  onResize?: (deltaLengthMeasures: number) => void
  className?: string
}

interface PointerInfo {
  id: number
  startX: number
  startY: number
  currentX: number
  currentY: number
}

export function TimelineBlock({
  block,
  patternName,
  color,
  isSelected,
  measureWidth,
  onClick,
  onDelete,
  onMove,
  onResize,
  className,
}: TimelineBlockProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [resizeOffset, setResizeOffset] = useState(0)
  const dragStartX = useRef<number | null>(null)
  const resizeStartX = useRef<number | null>(null)
  const hasMoved = useRef(false)

  // Multi-touch gesture state
  const activePointers = useRef<Map<number, PointerInfo>>(new Map())
  const [pointerCount, setPointerCount] = useState(0)
  const initialDistance = useRef<number | null>(null)
  const initialMidpointX = useRef<number | null>(null)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!isSelected) return

    // Track this pointer
    activePointers.current.set(e.pointerId, {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
    })
    setPointerCount(activePointers.current.size)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)

    // If this is a second pointer, initialize multi-touch gestures
    if (activePointers.current.size === 2) {
      const pointers = Array.from(activePointers.current.values())
      const dx = pointers[1].currentX - pointers[0].currentX
      const dy = pointers[1].currentY - pointers[0].currentY
      initialDistance.current = Math.sqrt(dx * dx + dy * dy)
      initialMidpointX.current = (pointers[0].currentX + pointers[1].currentX) / 2
    } else if (activePointers.current.size === 1 && onMove) {
      // Single pointer - prepare for drag
      dragStartX.current = e.clientX
      hasMoved.current = false
      setIsDragging(true)
    }
  }, [isSelected, onMove])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    // Update pointer position if tracking this pointer
    const pointer = activePointers.current.get(e.pointerId)
    if (pointer) {
      pointer.currentX = e.clientX
      pointer.currentY = e.clientY
    }

    // Handle multi-touch gestures (two fingers)
    if (activePointers.current.size === 2) {
      const pointers = Array.from(activePointers.current.values())

      // Calculate current distance for pinch
      const dx = pointers[1].currentX - pointers[0].currentX
      const dy = pointers[1].currentY - pointers[0].currentY
      const currentDistance = Math.sqrt(dx * dx + dy * dy)

      // Calculate current midpoint for two-finger drag
      const currentMidpointX = (pointers[0].currentX + pointers[1].currentX) / 2

      // Two-finger horizontal drag to move
      if (initialMidpointX.current !== null && onMove) {
        const midpointDelta = currentMidpointX - initialMidpointX.current
        if (Math.abs(midpointDelta) > 5) {
          hasMoved.current = true
        }
        setDragOffset(midpointDelta)
        setIsDragging(true)
      }

      // Pinch to resize
      if (initialDistance.current !== null && onResize) {
        const distanceDelta = currentDistance - initialDistance.current
        setResizeOffset(distanceDelta)
        setIsResizing(true)
      }

      return
    }

    // Handle single-touch resize (via resize handle)
    if (isResizing && resizeStartX.current !== null) {
      const deltaX = e.clientX - resizeStartX.current
      setResizeOffset(deltaX)
      return
    }

    // Handle single-touch drag (via drag handle)
    if (!isDragging || dragStartX.current === null) return

    const deltaX = e.clientX - dragStartX.current
    if (Math.abs(deltaX) > 5) {
      hasMoved.current = true
    }
    setDragOffset(deltaX)
  }, [isDragging, isResizing, onMove, onResize])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    // Remove this pointer from tracking
    activePointers.current.delete(e.pointerId)
    setPointerCount(activePointers.current.size)
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)

    // If all pointers are released, finalize any gesture
    if (activePointers.current.size === 0) {
      // Handle resize end
      if (isResizing) {
        setIsResizing(false)

        if (onResize) {
          const deltaMeasures = Math.round(resizeOffset / measureWidth)
          if (deltaMeasures !== 0) {
            onResize(deltaMeasures)
          }
        }

        setResizeOffset(0)
        resizeStartX.current = null
        initialDistance.current = null
      }

      // Handle drag end
      if (isDragging) {
        setIsDragging(false)

        if (hasMoved.current && onMove) {
          const deltaMeasures = Math.round(dragOffset / measureWidth)
          if (deltaMeasures !== 0) {
            onMove(deltaMeasures)
          }
        }

        setDragOffset(0)
        dragStartX.current = null
        initialMidpointX.current = null
      }

      hasMoved.current = false
    } else if (activePointers.current.size === 1) {
      // Transition from multi-touch to single touch
      // Reset multi-touch state
      initialDistance.current = null
      initialMidpointX.current = null
      setIsResizing(false)
      setIsDragging(false)
      setResizeOffset(0)
      setDragOffset(0)
    }
  }, [isDragging, isResizing, dragOffset, resizeOffset, measureWidth, onMove, onResize])

  const handleClick = useCallback((e: React.MouseEvent) => {
    // Don't trigger click if we just finished dragging
    if (hasMoved.current) {
      e.stopPropagation()
      return
    }
    onClick()
  }, [onClick])

  // Resize start handler - only on resize handle, but captures on parent
  const handleResizePointerDown = useCallback((e: React.PointerEvent) => {
    if (!isSelected || !onResize) return
    e.stopPropagation()

    resizeStartX.current = e.clientX
    setIsResizing(true)
    // Capture on the block element itself so move/up events are received there
    const blockElement = (e.target as HTMLElement).closest('[data-block]') as HTMLElement
    if (blockElement) {
      blockElement.setPointerCapture(e.pointerId)
    }
  }, [isSelected, onResize])

  const isInteracting = isDragging || isResizing
  const isMultiTouch = pointerCount > 1

  return (
    <div
      data-block
      className={cn(
        'relative h-full rounded-lg transition-all',
        'flex items-start justify-start p-1.5',
        'cursor-pointer hover:brightness-110',
        isInteracting && 'opacity-80 z-10',
        isDragging && 'cursor-grabbing',
        isResizing && 'cursor-ew-resize',
        !isInteracting && 'duration-75',
        isMultiTouch && 'ring-2 ring-white/50',
        className
      )}
      style={{
        width: isResizing ? `calc(100% + ${resizeOffset}px)` : '100%',
        background: isMultiTouch
          ? `radial-gradient(ellipse at 30% 30%, ${color}ff 0%, ${color}cc 50%, ${color}99 100%)`
          : `radial-gradient(ellipse at 30% 30%, ${color}dd 0%, ${color}aa 50%, ${color}77 100%)`,
        boxShadow: isSelected
          ? `0 0 0 2px ${color}, 0 0 12px ${color}80, inset 1px 1px 3px rgba(255,255,255,0.2), inset -1px -1px 3px rgba(0,0,0,0.3)`
          : 'inset 1px 1px 3px rgba(255,255,255,0.15), inset -1px -1px 3px rgba(0,0,0,0.3)',
        transform: isDragging ? `translateX(${dragOffset}px)` : undefined,
        // Prevent scroll during drag/resize operations when selected
        touchAction: isSelected ? 'none' : 'auto',
      }}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      role="button"
      tabIndex={0}
      aria-label={`${patternName} block, ${block.lengthMeasures} measures at measure ${block.startMeasure + 1}${isSelected ? ', selected' : ''}${isMultiTouch ? ', multi-touch active' : ''}`}
      aria-pressed={isSelected}
    >
      <span
        className="text-[8px] font-medium text-white/90 leading-tight truncate max-w-full pointer-events-none"
        style={{
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
        }}
      >
        {patternName}
      </span>

      {/* Multi-touch gesture indicator */}
      {isMultiTouch && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="px-2 py-1 rounded bg-black/60 backdrop-blur-sm border border-white/30">
            <span className="text-[10px] font-semibold text-white">
              {isDragging && isResizing ? '2-Finger Move + Resize' : isDragging ? '2-Finger Move' : isResizing ? 'Pinch Resize' : '2-Finger'}
            </span>
          </div>
        </div>
      )}

      {/* Drag handle - visible when selected */}
      {isSelected && onMove && !isInteracting && (
        <div className="absolute left-1 bottom-1 text-white/50">
          <GripVertical className="h-3 w-3" />
        </div>
      )}

      {/* Resize handle - visible when selected, larger touch target */}
      {isSelected && onResize && !isDragging && (
        <div
          className={cn(
            'absolute -right-2 inset-y-0 w-6 cursor-ew-resize',
            'flex items-center justify-center',
            'hover:bg-white/20 transition-colors',
            isResizing && 'bg-white/30'
          )}
          style={{ touchAction: 'none' }}
          onPointerDown={handleResizePointerDown}
        >
          <div className="w-0.5 h-6 bg-white/60 rounded-full" />
        </div>
      )}

      {/* Delete button - visible when selected */}
      {isSelected && onDelete && !isInteracting && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80 transition-colors shadow-md z-10"
          aria-label={`Delete ${patternName} block`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
