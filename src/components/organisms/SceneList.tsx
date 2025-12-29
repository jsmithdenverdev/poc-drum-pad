import { useRef } from 'react'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'
import { SceneCard } from '@/components/molecules/SceneCard'
import type { Scene, SavedPattern, TimelineTrack } from '@/types/audio.types'

interface SceneListProps {
  scenes: Scene[]
  selectedSceneId: string | null
  tracks: TimelineTrack[]
  savedPatterns: SavedPattern[]
  onSceneSelect: (sceneId: string) => void
  onAddScene: () => void
  onEditScene?: (sceneId: string) => void
  onDuplicateScene: (sceneId: string) => void
  onDeleteScene: (sceneId: string) => void
  className?: string
}

// Haptic feedback helper
const vibrate = (ms: number) => {
  if (navigator.vibrate) {
    navigator.vibrate(ms)
  }
}

export function SceneList({
  scenes,
  selectedSceneId,
  tracks: _tracks,
  savedPatterns: _savedPatterns,
  onSceneSelect,
  onAddScene,
  onEditScene,
  onDuplicateScene,
  onDeleteScene,
  className,
}: SceneListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const handleAddScene = () => {
    onAddScene()
    vibrate(5)
    // Scroll to the end after adding a scene
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          left: scrollContainerRef.current.scrollWidth,
          behavior: 'smooth',
        })
      }
    }, 100)
  }

  // Count patterns in a scene
  const getPatternCount = (scene: Scene): number => {
    return Object.keys(scene.trackPatterns).length
  }

  // Empty state
  if (scenes.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full p-4 text-center', className)}>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">No scenes yet</p>
          <p className="text-xs text-muted-foreground/70">
            Scenes let you quickly switch between different pattern arrangements.
          </p>
          <button
            onClick={handleAddScene}
            className="mt-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            + Add First Scene
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold">Scenes</h2>
        <button
          onClick={handleAddScene}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          aria-label="Add new scene"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Scene</span>
        </button>
      </div>

      {/* Scrollable scene list */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto overflow-y-hidden p-4"
      >
        <div className="flex gap-3 min-h-0">
          {scenes.map((scene) => (
            <div key={scene.id} className="flex-shrink-0 w-[200px]">
              <SceneCard
                scene={scene}
                isSelected={selectedSceneId === scene.id}
                patternCount={getPatternCount(scene)}
                onClick={() => onSceneSelect(scene.id)}
                onEdit={onEditScene ? () => onEditScene(scene.id) : undefined}
                onDuplicate={() => onDuplicateScene(scene.id)}
                onDelete={() => onDeleteScene(scene.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
