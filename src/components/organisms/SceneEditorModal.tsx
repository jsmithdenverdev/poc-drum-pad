import { useState } from 'react'
import { X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Scene, TimelineTrack, SavedPattern, SceneDuration } from '@/types/audio.types'

interface SceneEditorModalProps {
  scene: Scene
  tracks: TimelineTrack[]
  savedPatterns: SavedPattern[]
  isOpen: boolean
  onClose: () => void
  onUpdate: (updates: Partial<Omit<Scene, 'id'>>) => void
  onPatternSet: (trackId: string, patternId: string | null) => void
}

const DURATION_OPTIONS: SceneDuration[] = [4, 8, 16]

export function SceneEditorModal({
  scene,
  tracks,
  savedPatterns,
  isOpen,
  onClose,
  onUpdate,
  onPatternSet,
}: SceneEditorModalProps) {
  const [name, setName] = useState(scene.name)
  const [duration, setDuration] = useState<SceneDuration>(scene.duration)

  const handleSave = () => {
    onUpdate({
      name: name.trim() || scene.name,
      duration,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Scene</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Scene Name */}
          <div className="space-y-2">
            <Label htmlFor="scene-name">Scene Name</Label>
            <Input
              id="scene-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Intro, Verse 1, Chorus"
              className="w-full"
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="scene-duration">Duration (bars)</Label>
            <Select
              value={duration.toString()}
              onValueChange={(value) => setDuration(parseInt(value) as SceneDuration)}
            >
              <SelectTrigger id="scene-duration" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((d) => (
                  <SelectItem key={d} value={d.toString()}>
                    {d} bars
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pattern Assignments */}
          <div className="space-y-2">
            <Label>Pattern Assignments</Label>
            {tracks.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No tracks available. Add tracks first.
              </p>
            ) : (
              <div className="space-y-2">
                {tracks.map((track) => {
                  const assignedPatternId = scene.trackPatterns[track.id]

                  return (
                    <div key={track.id} className="flex items-center gap-2">
                      {/* Track Color Indicator */}
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: track.color }}
                      />

                      {/* Track Name */}
                      <span className="text-sm font-medium flex-shrink-0 min-w-[80px] truncate">
                        {track.name}
                      </span>

                      {/* Pattern Selector */}
                      <div className="flex-1 min-w-0">
                        <Select
                          value={assignedPatternId || 'none'}
                          onValueChange={(value) => {
                            onPatternSet(track.id, value === 'none' ? null : value)
                          }}
                        >
                          <SelectTrigger className="w-full h-8 text-xs">
                            <SelectValue placeholder="No pattern" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              <span className="text-muted-foreground">No pattern</span>
                            </SelectItem>
                            {savedPatterns.map((pattern) => (
                              <SelectItem key={pattern.id} value={pattern.id}>
                                {pattern.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Clear Button */}
                      {assignedPatternId && (
                        <button
                          onClick={() => onPatternSet(track.id, null)}
                          className="p-1 hover:bg-accent rounded transition-colors"
                          aria-label="Clear pattern"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
