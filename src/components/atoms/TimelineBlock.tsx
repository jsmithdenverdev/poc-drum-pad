import { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { X, GripVertical, Edit, Copy, Trash2 } from 'lucide-react'
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
  onDuplicate?: () => void
  onEdit?: () => void
  className?: string
}

interface PointerState {
  id: number
  x: number
  y: number
}

// Haptic feedback helper
const vibrate = (pattern: number | number[]) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern)
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
  const [isPinching, setIsPinching] = useState(false)
  const [isTwoFingerDrag, setIsTwoFingerDrag] = useState(false)
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 })
  const [dragOffset, setDragOffset] = useState(0)
  const [resizeOffset, setResizeOffset] = useState(0)

  const dragStartX = useRef<number | null>(null)
  const resizeStartX = useRef<number | null>(null)
  const hasMoved = useRef(false)
  const activePointers = useRef<Map<number, PointerState>>(new Map())
  const initialPinchDistance = useRef<number | null>(null)
  const initialTwoFingerMidpoint = useRef<{ x: number; y: number } | null>(null)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const isLongPressActive = useRef(false)

  // Clear long press timer
  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    isLongPressActive.current = false
  }, [])

  // Calculate distance between two pointers
  const getDistance = useCallback((p1: PointerState, p2: PointerState) => {
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  // Calculate midpoint between two pointers
  const getMidpoint = useCallback((p1: PointerState, p2: PointerState) => {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    }
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Add pointer to active set
    activePointers.current.set(e.pointerId, {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
    })

    const pointerCount = activePointers.current.size

    // Start long-press timer only on single touch for selected block
    if (pointerCount === 1 && isSelected) {
      clearLongPress()
      longPressTimer.current = setTimeout(() => {
        isLongPressActive.current = true
        vibrate(50) // Haptic feedback for long press

        // Show context menu at touch position
        setContextMenuPos({ x: e.clientX, y: e.clientY })
        setShowContextMenu(true)
      }, 500)
    } else {
      clearLongPress()
    }

    // Two-finger gestures for selected blocks
    if (pointerCount === 2 && isSelected) {
      const pointers = Array.from(activePointers.current.values())

      // Initialize pinch distance
      initialPinchDistance.current = getDistance(pointers[0], pointers[1])

      // Initialize two-finger midpoint for drag
      initialTwoFingerMidpoint.current = getMidpoint(pointers[0], pointers[1])

      vibrate(10) // Light haptic for multi-touch start
    }

    // Single-finger drag (only if not waiting for potential multi-touch)
    if (pointerCount === 1 && isSelected && onMove && !isResizing) {
      dragStartX.current = e.clientX
      hasMoved.current = false
      setIsDragging(true)
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    }
  }, [isSelected, onMove, isResizing, clearLongPress, getDistance, getMidpoint])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    // Update pointer position
    if (activePointers.current.has(e.pointerId)) {
      activePointers.current.set(e.pointerId, {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
      })
    }

    const pointerCount = activePointers.current.size

    // Cancel long press on any movement
    if (hasMoved.current || Math.abs(e.movementX) > 3 || Math.abs(e.movementY) > 3) {
      clearLongPress()
    }

    // Handle resize (single-finger on resize handle)
    if (isResizing && resizeStartX.current !== null) {
      const deltaX = e.clientX - resizeStartX.current
      setResizeOffset(deltaX)
      hasMoved.current = true
      return
    }

    // Two-finger gestures for selected blocks
    if (pointerCount === 2 && isSelected) {
      const pointers = Array.from(activePointers.current.values())

      // Pinch to resize
      if (initialPinchDistance.current !== null && onResize) {
        const currentDistance = getDistance(pointers[0], pointers[1])
        const deltaDistance = currentDistance - initialPinchDistance.current

        // Convert distance change to measure change (scale by measureWidth)
        const deltaMeasures = deltaDistance / measureWidth

        if (Math.abs(deltaMeasures) > 0.1) {
          setIsPinching(true)
          setResizeOffset(deltaDistance)
          hasMoved.current = true
        }
      }

      // Two-finger drag to move
      if (initialTwoFingerMidpoint.current !== null && onMove) {
        const currentMidpoint = getMidpoint(pointers[0], pointers[1])
        const deltaX = currentMidpoint.x - initialTwoFingerMidpoint.current.x

        if (Math.abs(deltaX) > 5) {
          setIsTwoFingerDrag(true)
          setDragOffset(deltaX)
          hasMoved.current = true
        }
      }

      return
    }

    // Single-finger drag
    if (isDragging && dragStartX.current !== null && pointerCount === 1) {
      const deltaX = e.clientX - dragStartX.current
      if (Math.abs(deltaX) > 5) {
        hasMoved.current = true
      }
      setDragOffset(deltaX)
    }
  }, [isSelected, isDragging, isResizing, onMove, onResize, measureWidth, clearLongPress, getDistance, getMidpoint])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    // Remove pointer from active set
    activePointers.current.delete(e.pointerId)

    // Clear long press if this was the last pointer
    if (activePointers.current.size === 0) {
      clearLongPress()
    }

    // Handle pinch-to-resize end
    if (isPinching && onResize) {
      setIsPinching(false)

      const deltaMeasures = Math.round(resizeOffset / measureWidth)
      if (deltaMeasures !== 0) {
        onResize(deltaMeasures)
        vibrate(10) // Haptic feedback for resize completion
      }

      setResizeOffset(0)
      initialPinchDistance.current = null
      return
    }

    // Handle two-finger drag end
    if (isTwoFingerDrag && onMove) {
      setIsTwoFingerDrag(false)

      const deltaMeasures = Math.round(dragOffset / measureWidth)
      if (deltaMeasures !== 0) {
        onMove(deltaMeasures)
        vibrate(10) // Haptic feedback for move completion
      }

      setDragOffset(0)
      initialTwoFingerMidpoint.current = null
      return
    }

    // Handle resize end (single-finger on handle)
    if (isResizing) {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
      setIsResizing(false)

      if (onResize) {
        const deltaMeasures = Math.round(resizeOffset / measureWidth)
        if (deltaMeasures !== 0) {
          onResize(deltaMeasures)
          vibrate(10) // Haptic feedback
        }
      }

      setResizeOffset(0)
      resizeStartX.current = null
      return
    }

    // Handle single-finger drag end
    if (isDragging) {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
      setIsDragging(false)

      if (hasMoved.current && onMove) {
        const deltaMeasures = Math.round(dragOffset / measureWidth)
        if (deltaMeasures !== 0) {
          onMove(deltaMeasures)
          vibrate(10) // Haptic feedback
        }
      }

      setDragOffset(0)
      dragStartX.current = null
    }

    // Reset moved flag when all pointers are up
    if (activePointers.current.size === 0) {
      hasMoved.current = false
    }
  }, [isDragging, isResizing, isPinching, isTwoFingerDrag, dragOffset, resizeOffset, measureWidth, onMove, onResize, clearLongPress])

  const handleClick = useCallback((e: React.MouseEvent) => {
    // Don't trigger click if we just finished dragging or long press was active
    if (hasMoved.current || isLongPressActive.current) {
      e.stopPropagation()
      return
    }
    onClick()
    vibrate(5) // Light haptic for selection
  }, [onClick])

  // Resize start handler - only on resize handle, but captures on parent
  const handleResizePointerDown = useCallback((e: React.PointerEvent) => {
    if (!isSelected || !onResize) return
    e.stopPropagation()

    // Clear long press when starting resize
    clearLongPress()

    // Add to active pointers
    activePointers.current.set(e.pointerId, {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
    })

    resizeStartX.current = e.clientX
    setIsResizing(true)
    // Capture on the block element itself so move/up events are received there
    const blockElement = (e.target as HTMLElement).closest('[data-block]') as HTMLElement
    if (blockElement) {
      blockElement.setPointerCapture(e.pointerId)
    }
  }, [isSelected, onResize, clearLongPress])

  // Close context menu when clicking outside
  useEffect(() => {
    if (!showContextMenu) return

    const handleClickOutside = () => setShowContextMenu(false)
    document.addEventListener('pointerdown', handleClickOutside)
    return () => document.removeEventListener('pointerdown', handleClickOutside)
  }, [showContextMenu])

  // Cleanup on unmount
  useEffect(() => {
    const pointers = activePointers.current
    return () => {
      clearLongPress()
      pointers.clear()
    }
  }, [clearLongPress])

  const isInteracting = isDragging || isResizing || isPinching || isTwoFingerDrag

  return (
    <>
      <div
        data-block
        className={cn(
          'relative h-full rounded-lg transition-all',
          'flex items-start justify-start p-1.5',
          'cursor-pointer hover:brightness-110 active:brightness-95',
          isInteracting && 'opacity-80 z-10',
          isDragging && 'cursor-grabbing',
          isResizing && 'cursor-ew-resize',
          isPinching && 'cursor-ew-resize scale-105',
          isTwoFingerDrag && 'cursor-grabbing scale-105',
          !isInteracting && 'duration-75',
          className
        )}
        style={{
          width: (isResizing || isPinching) ? `calc(100% + \${resizeOffset}px)` : '100%',
          background: `radial-gradient(ellipse at 30% 30%, \${color}dd 0%, \${color}aa 50%, \${color}77 100%)`,
          boxShadow: isSelected
            ? `0 0 0 2px \${color}, 0 0 12px \${color}80, inset 1px 1px 3px rgba(255,255,255,0.2), inset -1px -1px 3px rgba(0,0,0,0.3)`
            : 'inset 1px 1px 3px rgba(255,255,255,0.15), inset -1px -1px 3px rgba(0,0,0,0.3)',
          transform: (isDragging || isTwoFingerDrag) ? `translateX(\${dragOffset}px)` : undefined,
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
        aria-label={`\${patternName} block, \${block.lengthMeasures} measures at measure \${block.startMeasure + 1}\${isSelected ? ', selected' : ''}`}
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
            vibrate(10)
          }}
          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80 transition-colors shadow-md z-10"
          aria-label={`Delete \${patternName} block`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

        {/* Gesture feedback indicator */}
        {(isPinching || isTwoFingerDrag) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
              {isPinching ? 'Pinch to resize' : 'Two-finger drag'}
            </div>
          </div>
        )}
      </div>

      {/* Context menu - shown on long press */}
      {showContextMenu && (
        <div
          className="fixed bg-background border border-border rounded-lg shadow-lg overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100"
          style={{
            left: `\${contextMenuPos.x}px`,
            top: `\${contextMenuPos.y}px`,
            transform: 'translate(-50%, -100%) translateY(-8px)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col min-w-[140px]">
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowContextMenu(false)
                  onEdit()
                  vibrate(10)
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
            )}
            {onDuplicate && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowContextMenu(false)
                  onDuplicate()
                  vibrate(10)
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
              >
                <Copy className="h-4 w-4" />
                <span>Duplicate</span>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowContextMenu(false)
                  onDelete()
                  vibrate(10)
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors text-left border-t border-border"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
