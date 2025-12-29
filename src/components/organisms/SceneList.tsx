import { useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SceneCard } from '@/components/atoms/SceneCard'
import { SceneEditorModal } from './SceneEditorModal'
import type { Scene, TimelineTrack, SavedPattern } from '@/types/audio.types'

interface SceneListProps {
  scenes: Scene[]
  tracks: TimelineTrack[]
  savedPatterns: SavedPattern[]
  selectedSceneId: string | null
  onSceneSelect: (sceneId: string) => void
  onSceneAdd: () => void
  onSceneDelete: (sceneId: string) => void
  onSceneDuplicate: (sceneId: string) => void
  onSceneUpdate: (sceneId: string, updates: Partial<Omit<Scene, 'id'>>) => void
  onScenePatternSet: (sceneId: string, trackId: string, patternId: string | null) => void
  className?: string
}

export function SceneList({
  scenes,
  tracks,
  savedPatterns,
  selectedSceneId,
  onSceneSelect,
  onSceneAdd,
  onSceneDelete,
  onSceneDuplicate,
  onSceneUpdate,
  onScenePatternSet,
  className,
}: SceneListProps) {
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null)

  const editingScene = scenes.find(s => s.id === editingSceneId)

  // Empty state
  if (scenes.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full p-4 text-center', className)}>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">No scenes yet</p>
          <ol className="text-xs text-muted-foreground/70 space-y-1 text-left">
            <li>1. Create patterns in the Sequencer</li>
            <li>2. Save them to the library</li>
            <li>3. Add a scene and assign patterns</li>
          </ol>
          <button
            onClick={onSceneAdd}
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
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h2 className="font-semibold text-sm">Scenes</h2>
        <button
          onClick={onSceneAdd}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add Scene
        </button>
      </div>

      {/* Scene Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {scenes.map((scene) => (
          <SceneCard
            key={scene.id}
            scene={scene}
            tracks={tracks}
            savedPatterns={savedPatterns}
            isSelected={selectedSceneId === scene.id}
            onSelect={() => onSceneSelect(scene.id)}
            onDelete={() => onSceneDelete(scene.id)}
            onDuplicate={() => onSceneDuplicate(scene.id)}
            onEdit={() => setEditingSceneId(scene.id)}
          />
        ))}
      </div>

      {/* Scene Editor Modal */}
      {editingScene && (
        <SceneEditorModal
          scene={editingScene}
          tracks={tracks}
          savedPatterns={savedPatterns}
          isOpen={!!editingSceneId}
          onClose={() => setEditingSceneId(null)}
          onUpdate={(updates) => {
            onSceneUpdate(editingScene.id, updates)
            setEditingSceneId(null)
          }}
          onPatternSet={(trackId, patternId) => {
            onScenePatternSet(editingScene.id, trackId, patternId)
          }}
        />
      )}
    </div>
  )
}
