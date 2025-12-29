import { cn } from '@/lib/utils'
import { Edit3, Copy, Trash2 } from 'lucide-react'
import type { Scene } from '@/types/audio.types'

interface SceneCardProps {
  scene: Scene
  isSelected: boolean
  patternCount: number
  onClick: () => void
  onEdit?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  className?: string
}

// Haptic feedback helper
const vibrate = (ms: number) => {
  if (navigator.vibrate) {
    navigator.vibrate(ms)
  }
}

export function SceneCard({
  scene,
  isSelected,
  patternCount,
  onClick,
  onEdit,
  onDuplicate,
  onDelete,
  className,
}: SceneCardProps) {
  const handleClick = () => {
    onClick()
    vibrate(5)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.()
    vibrate(5)
  }

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDuplicate?.()
    vibrate(5)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.()
    vibrate(5)
  }

  return (
    <div
      className={cn(
        'relative p-3 rounded-lg border transition-all cursor-pointer',
        'hover:border-primary/50 hover:bg-accent/30',
        isSelected
          ? 'border-primary bg-primary/10 shadow-lg'
          : 'border-border bg-card',
        className
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`Scene: ${scene.name}, ${scene.duration} steps, ${patternCount} patterns${isSelected ? ', selected' : ''}`}
      aria-pressed={isSelected}
    >
      {/* Scene name */}
      <div className="mb-2">
        <h3 className="font-semibold text-sm truncate">{scene.name}</h3>
      </div>

      {/* Scene info */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
        <span>{scene.duration} steps</span>
        <span>{patternCount} pattern{patternCount !== 1 ? 's' : ''}</span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        {onEdit && (
          <button
            type="button"
            onClick={handleEdit}
            className="flex items-center gap-1.5 px-2 py-1 text-xs rounded hover:bg-accent transition-colors"
            aria-label="Edit scene"
          >
            <Edit3 className="h-3 w-3" />
            <span>Edit</span>
          </button>
        )}
        {onDuplicate && (
          <button
            type="button"
            onClick={handleDuplicate}
            className="flex items-center gap-1.5 px-2 py-1 text-xs rounded hover:bg-accent transition-colors"
            aria-label="Duplicate scene"
          >
            <Copy className="h-3 w-3" />
            <span>Duplicate</span>
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-2 py-1 text-xs rounded hover:bg-destructive/10 text-destructive transition-colors ml-auto"
            aria-label="Delete scene"
          >
            <Trash2 className="h-3 w-3" />
            <span>Delete</span>
          </button>
        )}
      </div>
    </div>
  )
}
