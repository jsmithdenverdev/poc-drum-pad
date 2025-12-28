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

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!isSelected || !onMove) return

    dragStartX.current = e.clientX
    hasMoved.current = false
    setIsDragging(true)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [isSelected, onMove])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || dragStartX.current === null) return

    const deltaX = e.clientX - dragStartX.current
    if (Math.abs(deltaX) > 5) {
      hasMoved.current = true
    }
    setDragOffset(deltaX)
  }, [isDragging])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return

    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    setIsDragging(false)

    if (hasMoved.current && onMove) {
      const deltaMeasures = Math.round(dragOffset / measureWidth)
      if (deltaMeasures !== 0) {
        onMove(deltaMeasures)
      }
    }

    setDragOffset(0)
    dragStartX.current = null
  }, [isDragging, dragOffset, measureWidth, onMove])

  const handleClick = useCallback((e: React.MouseEvent) => {
    // Don't trigger click if we just finished dragging
    if (hasMoved.current) {
      e.stopPropagation()
      return
    }
    onClick()
  }, [onClick])

  // Resize handlers
  const handleResizePointerDown = useCallback((e: React.PointerEvent) => {
    if (!isSelected || !onResize) return
    e.stopPropagation()

    resizeStartX.current = e.clientX
    setIsResizing(true)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [isSelected, onResize])

  const handleResizePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isResizing || resizeStartX.current === null) return

    const deltaX = e.clientX - resizeStartX.current
    setResizeOffset(deltaX)
  }, [isResizing])

  const handleResizePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isResizing) return

    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    setIsResizing(false)

    if (onResize) {
      const deltaMeasures = Math.round(resizeOffset / measureWidth)
      if (deltaMeasures !== 0) {
        onResize(deltaMeasures)
      }
    }

    setResizeOffset(0)
    resizeStartX.current = null
  }, [isResizing, resizeOffset, measureWidth, onResize])

  const isInteracting = isDragging || isResizing

  return (
    <div
      className={cn(
        'relative h-full rounded-lg transition-all',
        'flex items-start justify-start p-1.5',
        'cursor-pointer hover:brightness-110',
        isInteracting && 'opacity-80 z-10',
        isDragging && 'cursor-grabbing',
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

      {/* Resize handle - visible when selected */}
      {isSelected && onResize && !isDragging && (
        <div
          className={cn(
            'absolute right-0 inset-y-0 w-2 cursor-ew-resize',
            'flex items-center justify-center',
            'hover:bg-white/20 rounded-r-lg transition-colors',
            isResizing && 'bg-white/30'
          )}
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
          onPointerCancel={handleResizePointerUp}
        >
          <div className="w-0.5 h-4 bg-white/50 rounded-full" />
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
          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80 transition-colors shadow-sm"
          aria-label={`Delete ${patternName} block`}
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  )
}
