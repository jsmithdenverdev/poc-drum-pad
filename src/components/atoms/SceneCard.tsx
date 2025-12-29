import React from 'react'
import { Trash2, Copy, Edit2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Scene, TimelineTrack, SavedPattern } from '@/types/audio.types'

interface SceneCardProps {
  scene: Scene
  tracks: TimelineTrack[]
  savedPatterns: SavedPattern[]
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onDuplicate: () => void
  onEdit: () => void
  className?: string
}

export const SceneCard = React.memo(function SceneCard({
  scene,
  tracks,
  savedPatterns,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
  onEdit,
  className,
}: SceneCardProps) {
  // Count how many patterns are assigned in this scene
  const assignedCount = Object.keys(scene.trackPatterns).length
  const totalTracks = tracks.length

  return (
    <div
      className={cn(
        'rounded-lg border-2 p-3 transition-all cursor-pointer',
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border bg-card hover:border-primary/50',
        className
      )}
      onClick={onSelect}
    >
      {/* Header: Name and Duration */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm truncate flex-1">{scene.name}</h3>
        <span className="text-xs text-muted-foreground ml-2">
          {scene.duration} bars
        </span>
      </div>

      {/* Pattern Info */}
      <div className="text-xs text-muted-foreground mb-3">
        {assignedCount === 0 ? (
          <span>No patterns assigned</span>
        ) : (
          <span>
            {assignedCount} / {totalTracks} tracks
          </span>
        )}
      </div>

      {/* Pattern List (compact) */}
      {assignedCount > 0 && (
        <div className="space-y-1 mb-3">
          {tracks.map(track => {
            const patternId = scene.trackPatterns[track.id]
            if (!patternId) return null

            const pattern = savedPatterns.find(p => p.id === patternId)
            if (!pattern) return null

            return (
              <div
                key={track.id}
                className="flex items-center gap-2 text-xs"
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: track.color }}
                />
                <span className="truncate flex-1">{pattern.name}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-1 pt-2 border-t border-border">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-accent transition-colors"
          aria-label="Edit scene"
        >
          <Edit2 className="w-3 h-3" />
          <span>Edit</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDuplicate()
          }}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-accent transition-colors"
          aria-label="Duplicate scene"
        >
          <Copy className="w-3 h-3" />
          <span>Copy</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-destructive/10 text-destructive transition-colors ml-auto"
          aria-label="Delete scene"
        >
          <Trash2 className="w-3 h-3" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  )
})
