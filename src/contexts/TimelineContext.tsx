import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import type { Timeline, TimelineBlock, SavedPattern, SequencerPattern } from '@/types/audio.types'

interface TimelineContextValue {
  // Timeline state
  timeline: Timeline
  setTimeline: (timeline: Timeline) => void

  // Saved patterns library
  savedPatterns: SavedPattern[]
  savePattern: (pattern: SequencerPattern, name?: string) => SavedPattern
  deletePattern: (patternId: string) => void

  // Timeline manipulation
  addBlock: (patternId: string, startMeasure: number, lengthMeasures?: number) => void
  removeBlock: (blockId: string) => void
  moveBlock: (blockId: string, newStartMeasure: number) => void
  resizeBlock: (blockId: string, newLength: number) => void

  // Playback state
  currentMeasure: number
  isTimelinePlaying: boolean
  toggleTimelinePlayback: () => void

  // Selection
  selectedMeasure: number | null
  setSelectedMeasure: (measure: number | null) => void
  selectedBlock: TimelineBlock | null
  setSelectedBlock: (block: TimelineBlock | null) => void
}

const TimelineContext = createContext<TimelineContextValue | undefined>(undefined)

const TIMELINE_STORAGE_KEY = 'drum-pad-timeline'
const PATTERNS_STORAGE_KEY = 'drum-pad-saved-patterns'
const SAVE_DEBOUNCE_MS = 500

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Default empty timeline
const DEFAULT_TIMELINE: Timeline = {
  id: 'default',
  name: 'My Track',
  bpm: 120,
  blocks: [],
}

// Check if localStorage is available
function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

// Load timeline from localStorage
function loadTimelineFromStorage(): Timeline {
  if (!isLocalStorageAvailable()) {
    return DEFAULT_TIMELINE
  }
  try {
    const stored = localStorage.getItem(TIMELINE_STORAGE_KEY)
    if (!stored) return DEFAULT_TIMELINE
    return JSON.parse(stored) as Timeline
  } catch {
    return DEFAULT_TIMELINE
  }
}

// Load saved patterns from localStorage
function loadPatternsFromStorage(): SavedPattern[] {
  if (!isLocalStorageAvailable()) {
    return []
  }
  try {
    const stored = localStorage.getItem(PATTERNS_STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored) as SavedPattern[]
  } catch {
    return []
  }
}

// Save timeline to localStorage
function saveTimelineToStorage(timeline: Timeline): void {
  if (!isLocalStorageAvailable()) return
  try {
    localStorage.setItem(TIMELINE_STORAGE_KEY, JSON.stringify(timeline))
  } catch (error) {
    console.error('Failed to save timeline:', error)
  }
}

// Save patterns to localStorage
function savePatternsToStorage(patterns: SavedPattern[]): void {
  if (!isLocalStorageAvailable()) return
  try {
    localStorage.setItem(PATTERNS_STORAGE_KEY, JSON.stringify(patterns))
  } catch (error) {
    console.error('Failed to save patterns:', error)
  }
}

export function TimelineProvider({ children }: { children: ReactNode }) {
  const [timeline, setTimeline] = useState<Timeline>(loadTimelineFromStorage)
  const [savedPatterns, setSavedPatterns] = useState<SavedPattern[]>(loadPatternsFromStorage)
  const [currentMeasure, setCurrentMeasure] = useState(0)
  const [isTimelinePlaying, setIsTimelinePlaying] = useState(false)
  const [selectedMeasure, setSelectedMeasure] = useState<number | null>(null)
  const [selectedBlock, setSelectedBlock] = useState<TimelineBlock | null>(null)

  const saveTimelineTimeoutRef = useRef<number | null>(null)
  const savePatternsTimeoutRef = useRef<number | null>(null)
  const playbackIntervalRef = useRef<number | null>(null)

  // Debounced save for timeline
  useEffect(() => {
    if (saveTimelineTimeoutRef.current !== null) {
      window.clearTimeout(saveTimelineTimeoutRef.current)
    }
    saveTimelineTimeoutRef.current = window.setTimeout(() => {
      saveTimelineToStorage(timeline)
    }, SAVE_DEBOUNCE_MS)
    return () => {
      if (saveTimelineTimeoutRef.current !== null) {
        window.clearTimeout(saveTimelineTimeoutRef.current)
      }
    }
  }, [timeline])

  // Debounced save for patterns
  useEffect(() => {
    if (savePatternsTimeoutRef.current !== null) {
      window.clearTimeout(savePatternsTimeoutRef.current)
    }
    savePatternsTimeoutRef.current = window.setTimeout(() => {
      savePatternsToStorage(savedPatterns)
    }, SAVE_DEBOUNCE_MS)
    return () => {
      if (savePatternsTimeoutRef.current !== null) {
        window.clearTimeout(savePatternsTimeoutRef.current)
      }
    }
  }, [savedPatterns])

  // Timeline playback - advance measure based on BPM
  useEffect(() => {
    if (isTimelinePlaying) {
      // Calculate ms per measure (4 beats per measure, at timeline BPM)
      const msPerBeat = (60 / timeline.bpm) * 1000
      const msPerMeasure = msPerBeat * 4

      playbackIntervalRef.current = window.setInterval(() => {
        setCurrentMeasure(prev => (prev + 1) % 16) // Loop at 16 measures
      }, msPerMeasure)
    }

    return () => {
      if (playbackIntervalRef.current !== null) {
        window.clearInterval(playbackIntervalRef.current)
      }
    }
  }, [isTimelinePlaying, timeline.bpm])

  // Save a pattern to the library
  const savePattern = useCallback((pattern: SequencerPattern, name?: string): SavedPattern => {
    const now = Date.now()
    const savedPattern: SavedPattern = {
      ...pattern,
      id: generateId(),
      name: name || pattern.name || `Pattern ${savedPatterns.length + 1}`,
      createdAt: now,
      updatedAt: now,
    }
    setSavedPatterns(prev => [...prev, savedPattern])
    return savedPattern
  }, [savedPatterns.length])

  // Delete a pattern from the library
  const deletePattern = useCallback((patternId: string) => {
    setSavedPatterns(prev => prev.filter(p => p.id !== patternId))
    // Also remove any blocks using this pattern
    setTimeline(prev => ({
      ...prev,
      blocks: prev.blocks.filter(b => b.patternId !== patternId),
    }))
  }, [])

  // Add a block to the timeline
  const addBlock = useCallback((patternId: string, startMeasure: number, lengthMeasures = 1) => {
    const newBlock: TimelineBlock = {
      id: generateId(),
      patternId,
      startMeasure,
      lengthMeasures,
    }
    setTimeline(prev => ({
      ...prev,
      blocks: [...prev.blocks, newBlock],
    }))
  }, [])

  // Remove a block from the timeline
  const removeBlock = useCallback((blockId: string) => {
    setTimeline(prev => ({
      ...prev,
      blocks: prev.blocks.filter(b => b.id !== blockId),
    }))
    if (selectedBlock?.id === blockId) {
      setSelectedBlock(null)
    }
  }, [selectedBlock])

  // Move a block to a new position
  const moveBlock = useCallback((blockId: string, newStartMeasure: number) => {
    setTimeline(prev => ({
      ...prev,
      blocks: prev.blocks.map(b =>
        b.id === blockId ? { ...b, startMeasure: Math.max(0, newStartMeasure) } : b
      ),
    }))
  }, [])

  // Resize a block
  const resizeBlock = useCallback((blockId: string, newLength: number) => {
    setTimeline(prev => ({
      ...prev,
      blocks: prev.blocks.map(b =>
        b.id === blockId ? { ...b, lengthMeasures: Math.max(1, newLength) } : b
      ),
    }))
  }, [])

  // Toggle timeline playback
  const toggleTimelinePlayback = useCallback(() => {
    setIsTimelinePlaying(prev => !prev)
    if (isTimelinePlaying) {
      setCurrentMeasure(0)
    }
  }, [isTimelinePlaying])

  return (
    <TimelineContext.Provider
      value={{
        timeline,
        setTimeline,
        savedPatterns,
        savePattern,
        deletePattern,
        addBlock,
        removeBlock,
        moveBlock,
        resizeBlock,
        currentMeasure,
        isTimelinePlaying,
        toggleTimelinePlayback,
        selectedMeasure,
        setSelectedMeasure,
        selectedBlock,
        setSelectedBlock,
      }}
    >
      {children}
    </TimelineContext.Provider>
  )
}

export function useTimelineContext() {
  const context = useContext(TimelineContext)
  if (!context) {
    throw new Error('useTimelineContext must be used within TimelineProvider')
  }
  return context
}
