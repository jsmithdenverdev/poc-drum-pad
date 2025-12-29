import { SceneCard } from '@/components/atoms/SceneCard'
import type { Scene } from '@/types/audio.types'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'

interface SceneListProps {
  scenes: Scene[]
  selectedSceneId: string | null
  onSceneSelect: (sceneId: string) => void
  onAddScene: () => void
  onEditScene?: (sceneId: string) => void
  onDuplicateScene?: (sceneId: string) => void
  onDeleteScene?: (sceneId: string) => void
  className?: string
}

export function SceneList({
  scenes,
  selectedSceneId,
  onSceneSelect,
  onAddScene,
  onEditScene,
  onDuplicateScene,
  onDeleteScene,
  className,
}: SceneListProps) {
  const hasScenes = scenes.length > 0

  // Empty state
  if (!hasScenes) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full p-4 text-center', className)}>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">No scenes yet</p>
          <ol className="text-xs text-muted-foreground/70 space-y-1 text-left">
            <li>1. Tap + below to create a scene</li>
            <li>2. Assign patterns to tracks</li>
            <li>3. Set the scene duration</li>
          </ol>
          <button
            onClick={onAddScene}
            className="mt-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add First Scene
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-border/50 bg-secondary/30 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Scenes</h2>
        <button
          onClick={onAddScene}
          className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Scene
        </button>
      </div>

      {/* Scene list - scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {scenes.map((scene) => {
            const patternCount = Object.keys(scene.trackPatterns).length
            return (
              <SceneCard
                key={scene.id}
                scene={scene}
                isSelected={scene.id === selectedSceneId}
                patternCount={patternCount}
                onClick={() => onSceneSelect(scene.id)}
                onEdit={onEditScene ? () => onEditScene(scene.id) : undefined}
                onDuplicate={onDuplicateScene ? () => onDuplicateScene(scene.id) : undefined}
                onDelete={onDeleteScene ? () => onDeleteScene(scene.id) : undefined}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
