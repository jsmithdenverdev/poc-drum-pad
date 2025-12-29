import { useState, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { X, GripVertical, Copy, Edit3, Trash2 } from 'lucide-react'
import type { TimelineBlock as TimelineBlockType } from '@/types/audio.types'

interface PointerInfo {
  id: number
  x: number
  y: number
}

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
  onDuplicate?: () => void
  onEdit?: () => void
  className?: string
}

// Haptic feedback helper
const vibrate = (ms: number) => {
  if (navigator.vibrate) {
    navigator.vibrate(ms)
  }
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
  onDuplicate,
  onEdit,
  className,
}: TimelineBlockProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [resizeOffset, setResizeOffset] = useState(0)
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 })
  const [pointerCount, setPointerCount] = useState(0)

  const dragStartX = useRef<number | null>(null)
  const resizeStartX = useRef<number | null>(null)
  const hasMoved = useRef(false)

  // Multi-touch tracking
  const activePointers = useRef<Map<number, PointerInfo>>(new Map())
  const initialPinchDistance = useRef<number | null>(null)
  const initialPinchMidpoint = useRef<{ x: number; y: number } | null>(null)

  // Long-press timer
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressStartPos = useRef<{ x: number; y: number } | null>(null)

  // Calculate distance between two points
  const getDistance = useCallback((p1: PointerInfo, p2: PointerInfo): number => {
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  // Calculate midpoint between two points
  const getMidpoint = useCallback((p1: PointerInfo, p2: PointerInfo): { x: number; y: number } => {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    }
  }, [])

  // Clear long-press timer
  const clearLongPressTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    longPressStartPos.current = null
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Track this pointer
    activePointers.current.set(e.pointerId, {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
    })

    const currentPointerCount = activePointers.current.size
    setPointerCount(currentPointerCount)

    // Single finger - start single-finger drag or long-press
    if (currentPointerCount === 1 && isSelected && onMove) {
      dragStartX.current = e.clientX
      hasMoved.current = false
      setIsDragging(true)
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)

      // Start long-press timer
      longPressStartPos.current = { x: e.clientX, y: e.clientY }
      longPressTimer.current = setTimeout(() => {
        vibrate(50)
        setShowContextMenu(true)
        setContextMenuPos({ x: e.clientX, y: e.clientY })
        clearLongPressTimer()
      }, 500)
    }

    // Two fingers - start pinch or two-finger drag
    if (currentPointerCount === 2 && isSelected) {
      // Cancel any existing single-finger drag
      setIsDragging(false)
      dragStartX.current = null
      clearLongPressTimer()

      const pointers = Array.from(activePointers.current.values())
      const distance = getDistance(pointers[0], pointers[1])
      const midpoint = getMidpoint(pointers[0], pointers[1])

      initialPinchDistance.current = distance
      initialPinchMidpoint.current = midpoint
    }
  }, [isSelected, onMove, getDistance, getMidpoint, clearLongPressTimer])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    // Update pointer position
    if (activePointers.current.has(e.pointerId)) {
      activePointers.current.set(e.pointerId, {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
      })
    }

    const currentPointerCount = activePointers.current.size

    // Check if moved too much for long-press
    if (longPressStartPos.current) {
      const dx = e.clientX - longPressStartPos.current.x
      const dy = e.clientY - longPressStartPos.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance > 5) {
        clearLongPressTimer()
      }
    }

    // Handle resize (from resize handle)
    if (isResizing && resizeStartX.current !== null) {
      const deltaX = e.clientX - resizeStartX.current
      setResizeOffset(deltaX)
      return
    }

    // Two-finger gestures (pinch-to-resize or two-finger drag)
    if (currentPointerCount === 2 && isSelected && initialPinchDistance.current !== null) {
      const pointers = Array.from(activePointers.current.values())
      const currentDistance = getDistance(pointers[0], pointers[1])
      const currentMidpoint = getMidpoint(pointers[0], pointers[1])

      // Pinch-to-resize
      if (onResize && initialPinchDistance.current) {
        const distanceDelta = currentDistance - initialPinchDistance.current
        // Map pinch distance to resize offset (scale factor for better UX)
        const resizeDelta = distanceDelta * 0.5
        setResizeOffset(resizeDelta)
      }

      // Two-finger drag
      if (onMove && initialPinchMidpoint.current) {
        const midpointDeltaX = currentMidpoint.x - initialPinchMidpoint.current.x
        setDragOffset(midpointDeltaX)
      }

      return
    }

    // Single-finger drag
    if (isDragging && dragStartX.current !== null && currentPointerCount === 1) {
      const deltaX = e.clientX - dragStartX.current
      if (Math.abs(deltaX) > 5) {
        hasMoved.current = true
        clearLongPressTimer()
      }
      setDragOffset(deltaX)
    }
  }, [isDragging, isResizing, isSelected, onMove, onResize, getDistance, getMidpoint, clearLongPressTimer])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    // Remove this pointer from tracking
    activePointers.current.delete(e.pointerId)
    const currentPointerCount = activePointers.current.size
    setPointerCount(currentPointerCount)

    // Clear long-press timer on pointer up
    clearLongPressTimer()

    // Handle resize end (from resize handle)
    if (isResizing && currentPointerCount === 0) {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
      setIsResizing(false)

      if (onResize) {
        const deltaMeasures = Math.round(resizeOffset / measureWidth)
        if (deltaMeasures !== 0) {
          onResize(deltaMeasures)
          vibrate(10)
        }
      }

      setResizeOffset(0)
      resizeStartX.current = null
      return
    }

    // Handle two-finger gesture end
    if (currentPointerCount === 0 && (initialPinchDistance.current !== null || initialPinchMidpoint.current !== null)) {
      // Apply pinch-to-resize
      if (onResize && resizeOffset !== 0) {
        const deltaMeasures = Math.round(resizeOffset / measureWidth)
        if (deltaMeasures !== 0) {
          onResize(deltaMeasures)
          vibrate(10)
        }
      }

      // Apply two-finger drag
      if (onMove && dragOffset !== 0) {
        const deltaMeasures = Math.round(dragOffset / measureWidth)
        if (deltaMeasures !== 0) {
          onMove(deltaMeasures)
          vibrate(10)
        }
      }

      // Reset
      setDragOffset(0)
      setResizeOffset(0)
      initialPinchDistance.current = null
      initialPinchMidpoint.current = null
      return
    }

    // Handle single-finger drag end
    if (isDragging && currentPointerCount === 0) {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
      setIsDragging(false)

      if (hasMoved.current && onMove) {
        const deltaMeasures = Math.round(dragOffset / measureWidth)
        if (deltaMeasures !== 0) {
          onMove(deltaMeasures)
          vibrate(10)
        }
      }

      setDragOffset(0)
      dragStartX.current = null
    }
  }, [isDragging, isResizing, dragOffset, resizeOffset, measureWidth, onMove, onResize, clearLongPressTimer])

  const handleClick = useCallback((e: React.MouseEvent) => {
    // Don't trigger click if we just finished dragging or showing context menu
    if (hasMoved.current || showContextMenu) {
      e.stopPropagation()
      return
    }
    onClick()
    vibrate(5)
  }, [onClick, showContextMenu])

  // Context menu handlers
  const handleContextMenuAction = useCallback((action: 'edit' | 'duplicate' | 'delete') => {
    setShowContextMenu(false)
    vibrate(5)

    setTimeout(() => {
      switch (action) {
        case 'edit':
          onEdit?.()
          break
        case 'duplicate':
          onDuplicate?.()
          break
        case 'delete':
          onDelete?.()
          break
      }
    }, 50)
  }, [onEdit, onDuplicate, onDelete])

  // Resize start handler - only on resize handle, but captures on parent
  const handleResizePointerDown = useCallback((e: React.PointerEvent) => {
    if (!isSelected || !onResize) return
    e.stopPropagation()

    // Clear long-press timer
    clearLongPressTimer()

    resizeStartX.current = e.clientX
    setIsResizing(true)
    // Capture on the block element itself so move/up events are received there
    const blockElement = (e.target as HTMLElement).closest('[data-block]') as HTMLElement
    if (blockElement) {
      blockElement.setPointerCapture(e.pointerId)
    }
  }, [isSelected, onResize, clearLongPressTimer])

  const isInteracting = isDragging || isResizing || pointerCount > 1

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
        className
      )}
      style={{
        width: isResizing ? `calc(100% + ${resizeOffset}px)` : '100%',
        background: `radial-gradient(ellipse at 30% 30%, ${color}dd 0%, ${color}aa 50%, ${color}77 100%)`,
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
      aria-label={`${patternName} block, ${block.lengthMeasures} measures at measure ${block.startMeasure + 1}${isSelected ? ', selected' : ''}`}
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

      {/* Long-press context menu */}
      {showContextMenu && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowContextMenu(false)}
            onPointerDown={(e) => {
              e.stopPropagation()
              setShowContextMenu(false)
            }}
          />

          {/* Menu */}
          <div
            className="fixed z-50 bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
            style={{
              left: `${contextMenuPos.x}px`,
              top: `${contextMenuPos.y}px`,
              transform: 'translate(-50%, -100%) translateY(-8px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {onEdit && (
              <button
                type="button"
                onClick={() => handleContextMenuAction('edit')}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-accent transition-colors text-left"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit</span>
              </button>
            )}
            {onDuplicate && (
              <button
                type="button"
                onClick={() => handleContextMenuAction('duplicate')}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-accent transition-colors text-left"
              >
                <Copy className="h-4 w-4" />
                <span>Duplicate</span>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => handleContextMenuAction('delete')}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-destructive/10 text-destructive transition-colors text-left"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
