import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import type { Timeline, TimelineTrack, TimelineBlock, SavedPattern, SequencerPattern } from '@/types/audio.types'
import { TIMELINE_TRACK_COLORS } from '@/types/audio.types'
import { audioEngine } from '@/audio/audio-engine'
import { audioContextManager } from '@/audio/audio-context-manager'

interface TimelineContextValue {
  // Timeline state
  timeline: Timeline
  setTimeline: (timeline: Timeline) => void

  // Saved patterns library
  savedPatterns: SavedPattern[]
  savePattern: (pattern: SequencerPattern, name?: string) => SavedPattern
  deletePattern: (patternId: string) => void

  // Track management
  addTrack: (name?: string) => TimelineTrack
  removeTrack: (trackId: string) => void
  updateTrack: (trackId: string, updates: Partial<Omit<TimelineTrack, 'id' | 'blocks'>>) => void
  toggleTrackMute: (trackId: string) => void
  setTrackVolume: (trackId: string, volume: number) => void

  // Block management (within tracks)
  addBlock: (trackId: string, patternId: string, startMeasure: number, lengthMeasures?: number) => void
  removeBlock: (trackId: string, blockId: string) => void
  moveBlock: (trackId: string, blockId: string, newStartMeasure: number) => void
  resizeBlock: (trackId: string, blockId: string, newLength: number) => void

  // Playback state
  currentMeasure: number
  playbackPosition: number // Continuous 0.0 to measureCount for smooth animation
  isTimelinePlaying: boolean
  toggleTimelinePlayback: () => void

  // Selection
  selectedTrackId: string | null
  setSelectedTrackId: (trackId: string | null) => void
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

// Default empty timeline with track-based model
const DEFAULT_TIMELINE: Timeline = {
  id: 'default',
  name: 'My Track',
  bpm: 120,
  tracks: [],
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
    const parsed = JSON.parse(stored) as Timeline
    // Migration: if old format with blocks array, convert to tracks
    if ('blocks' in parsed && !('tracks' in parsed)) {
      const oldFormat = parsed as unknown as { id: string; name: string; bpm: number }
      return {
        id: oldFormat.id,
        name: oldFormat.name,
        bpm: oldFormat.bpm,
        tracks: [],
      }
    }
    return parsed
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

const MEASURE_COUNT = 16

export function TimelineProvider({ children }: { children: ReactNode }) {
  const [timeline, setTimeline] = useState<Timeline>(loadTimelineFromStorage)
  const [savedPatterns, setSavedPatterns] = useState<SavedPattern[]>(loadPatternsFromStorage)
  const [currentMeasure, setCurrentMeasure] = useState(0)
  const [playbackPosition, setPlaybackPosition] = useState(0)
  const [isTimelinePlaying, setIsTimelinePlaying] = useState(false)
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null)
  const [selectedMeasure, setSelectedMeasure] = useState<number | null>(null)
  const [selectedBlock, setSelectedBlock] = useState<TimelineBlock | null>(null)

  const saveTimelineTimeoutRef = useRef<number | null>(null)
  const savePatternsTimeoutRef = useRef<number | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const playbackStartTimeRef = useRef<number | null>(null)
  const playbackStartPositionRef = useRef<number>(0)
  const lastScheduledStepRef = useRef<number>(-1)
  const audioSchedulerRef = useRef<number | null>(null)

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

  // Timeline playback - smooth animation using requestAnimationFrame
  useEffect(() => {
    if (isTimelinePlaying) {
      // Calculate ms per measure (4 beats per measure, at timeline BPM)
      const msPerBeat = (60 / timeline.bpm) * 1000
      const msPerMeasure = msPerBeat * 4

      // Initialize start time if not set
      if (playbackStartTimeRef.current === null) {
        playbackStartTimeRef.current = performance.now()
        playbackStartPositionRef.current = playbackPosition
      }

      const animate = (now: number) => {
        if (!playbackStartTimeRef.current) return

        const elapsed = now - playbackStartTimeRef.current
        const measuresElapsed = elapsed / msPerMeasure
        const rawPosition = playbackStartPositionRef.current + measuresElapsed
        const newPosition = rawPosition % MEASURE_COUNT

        // Reset audio scheduler on loop
        if (Math.floor(rawPosition / MEASURE_COUNT) > Math.floor((rawPosition - measuresElapsed) / MEASURE_COUNT)) {
          lastScheduledStepRef.current = -1
        }

        setPlaybackPosition(newPosition)
        setCurrentMeasure(Math.floor(newPosition))

        animationFrameRef.current = requestAnimationFrame(animate)
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [isTimelinePlaying, timeline.bpm, playbackPosition])

  // Audio scheduling for timeline playback
  useEffect(() => {
    if (!isTimelinePlaying) {
      if (audioSchedulerRef.current !== null) {
        clearInterval(audioSchedulerRef.current)
        audioSchedulerRef.current = null
      }
      lastScheduledStepRef.current = -1
      return
    }

    // Constants for timing
    const STEPS_PER_MEASURE = 16 // 16th notes per measure
    const msPerBeat = (60 / timeline.bpm) * 1000
    const msPerStep = msPerBeat / 4 // 4 steps per beat
    const scheduleAheadMs = 100 // Schedule 100ms ahead

    const scheduleAudio = () => {
      if (!isTimelinePlaying || audioContextManager.isSuspended) return

      const currentTime = audioEngine.getCurrentTime()

      // Calculate current step in global timeline (wrapping at MEASURE_COUNT * STEPS_PER_MEASURE)
      const totalStepsInTimeline = MEASURE_COUNT * STEPS_PER_MEASURE
      const totalSteps = playbackPosition * STEPS_PER_MEASURE
      const currentGlobalStep = Math.floor(totalSteps)

      // Reset lastScheduledStep if we've looped (current step is less than last scheduled)
      if (currentGlobalStep < lastScheduledStepRef.current - totalStepsInTimeline / 2) {
        lastScheduledStepRef.current = -1
      }

      // Schedule steps up to scheduleAhead
      const stepsAhead = Math.ceil(scheduleAheadMs / msPerStep)

      for (let i = 0; i <= stepsAhead; i++) {
        const stepToSchedule = (currentGlobalStep + i) % totalStepsInTimeline

        // Skip if already scheduled (use modulo comparison)
        if (lastScheduledStepRef.current >= 0 &&
            stepToSchedule <= lastScheduledStepRef.current &&
            lastScheduledStepRef.current - stepToSchedule < totalStepsInTimeline / 2) {
          continue
        }

        // Calculate when this step should play
        const timeOffset = (i * msPerStep) / 1000 // Use loop offset directly for timing
        const scheduleTime = currentTime + timeOffset

        // Find blocks at this step's position
        const measureAtStep = stepToSchedule / STEPS_PER_MEASURE
        const stepWithinMeasure = stepToSchedule % STEPS_PER_MEASURE

        // Check each track for blocks at this position
        timeline.tracks.forEach(track => {
          if (track.muted) return

          track.blocks.forEach(block => {
            const blockStart = block.startMeasure
            const blockEnd = blockStart + block.lengthMeasures

            // Is this step within this block?
            if (measureAtStep >= blockStart && measureAtStep < blockEnd) {
              // Find the pattern for this block
              const pattern = savedPatterns.find(p => p.id === block.patternId)
              if (!pattern) return

              // Calculate position within block and wrap for pattern looping
              const patternStepCount = pattern.tracks[0]?.steps.length ?? 16
              const positionInBlock = measureAtStep - blockStart
              const patternMeasures = patternStepCount / STEPS_PER_MEASURE
              const loopedPosition = positionInBlock % patternMeasures
              const patternStep = Math.floor(loopedPosition * STEPS_PER_MEASURE) + (stepWithinMeasure % patternStepCount)
              const wrappedStep = patternStep % patternStepCount

              // Play active sounds at this step
              pattern.tracks.forEach(patternTrack => {
                const step = patternTrack.steps[wrappedStep]
                if (step?.active) {
                  const isSynth = patternTrack.soundType === 'synth'
                  const volume = (patternTrack.volume ?? 1) * track.volume
                  audioEngine.schedulePlay(patternTrack.soundId, scheduleTime, isSynth, volume)
                }
              })
            }
          })
        })

        lastScheduledStepRef.current = stepToSchedule
      }
    }

    // Schedule audio every 25ms (similar to sequencer)
    audioSchedulerRef.current = window.setInterval(scheduleAudio, 25)
    scheduleAudio() // Run immediately

    return () => {
      if (audioSchedulerRef.current !== null) {
        clearInterval(audioSchedulerRef.current)
        audioSchedulerRef.current = null
      }
    }
  }, [isTimelinePlaying, timeline.bpm, timeline.tracks, savedPatterns, playbackPosition])

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
    // Also remove any blocks using this pattern from all tracks
    setTimeline(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        blocks: track.blocks.filter(b => b.patternId !== patternId),
      })),
    }))
  }, [])

  // Add a new track
  const addTrack = useCallback((name?: string): TimelineTrack => {
    const trackCount = timeline.tracks.length
    const newTrack: TimelineTrack = {
      id: generateId(),
      name: name || `Track ${trackCount + 1}`,
      color: TIMELINE_TRACK_COLORS[trackCount % TIMELINE_TRACK_COLORS.length],
      muted: false,
      volume: 1,
      blocks: [],
    }
    setTimeline(prev => ({
      ...prev,
      tracks: [...prev.tracks, newTrack],
    }))
    return newTrack
  }, [timeline.tracks.length])

  // Remove a track
  const removeTrack = useCallback((trackId: string) => {
    setTimeline(prev => ({
      ...prev,
      tracks: prev.tracks.filter(t => t.id !== trackId),
    }))
    if (selectedTrackId === trackId) {
      setSelectedTrackId(null)
    }
  }, [selectedTrackId])

  // Update track properties
  const updateTrack = useCallback((trackId: string, updates: Partial<Omit<TimelineTrack, 'id' | 'blocks'>>) => {
    setTimeline(prev => ({
      ...prev,
      tracks: prev.tracks.map(t =>
        t.id === trackId ? { ...t, ...updates } : t
      ),
    }))
  }, [])

  // Toggle track mute
  const toggleTrackMute = useCallback((trackId: string) => {
    setTimeline(prev => ({
      ...prev,
      tracks: prev.tracks.map(t =>
        t.id === trackId ? { ...t, muted: !t.muted } : t
      ),
    }))
  }, [])

  // Set track volume
  const setTrackVolume = useCallback((trackId: string, volume: number) => {
    setTimeline(prev => ({
      ...prev,
      tracks: prev.tracks.map(t =>
        t.id === trackId ? { ...t, volume: Math.max(0, Math.min(1, volume)) } : t
      ),
    }))
  }, [])

  // Add a block to a specific track
  const addBlock = useCallback((trackId: string, patternId: string, startMeasure: number, lengthMeasures = 1) => {
    const newBlock: TimelineBlock = {
      id: generateId(),
      patternId,
      startMeasure,
      lengthMeasures,
    }
    setTimeline(prev => ({
      ...prev,
      tracks: prev.tracks.map(t =>
        t.id === trackId ? { ...t, blocks: [...t.blocks, newBlock] } : t
      ),
    }))
  }, [])

  // Remove a block from a track
  const removeBlock = useCallback((trackId: string, blockId: string) => {
    setTimeline(prev => ({
      ...prev,
      tracks: prev.tracks.map(t =>
        t.id === trackId ? { ...t, blocks: t.blocks.filter(b => b.id !== blockId) } : t
      ),
    }))
    if (selectedBlock?.id === blockId) {
      setSelectedBlock(null)
    }
  }, [selectedBlock])

  // Move a block within a track
  const moveBlock = useCallback((trackId: string, blockId: string, newStartMeasure: number) => {
    setTimeline(prev => ({
      ...prev,
      tracks: prev.tracks.map(t =>
        t.id === trackId
          ? {
              ...t,
              blocks: t.blocks.map(b =>
                b.id === blockId ? { ...b, startMeasure: Math.max(0, newStartMeasure) } : b
              ),
            }
          : t
      ),
    }))
  }, [])

  // Resize a block
  const resizeBlock = useCallback((trackId: string, blockId: string, newLength: number) => {
    setTimeline(prev => ({
      ...prev,
      tracks: prev.tracks.map(t =>
        t.id === trackId
          ? {
              ...t,
              blocks: t.blocks.map(b =>
                b.id === blockId ? { ...b, lengthMeasures: Math.max(1, newLength) } : b
              ),
            }
          : t
      ),
    }))
  }, [])

  // Toggle timeline playback
  const toggleTimelinePlayback = useCallback(() => {
    if (isTimelinePlaying) {
      // Stopping - reset refs
      playbackStartTimeRef.current = null
    } else {
      // Starting - will be initialized in the effect
      playbackStartTimeRef.current = null
    }
    setIsTimelinePlaying(prev => !prev)
  }, [isTimelinePlaying])

  return (
    <TimelineContext.Provider
      value={{
        timeline,
        setTimeline,
        savedPatterns,
        savePattern,
        deletePattern,
        addTrack,
        removeTrack,
        updateTrack,
        toggleTrackMute,
        setTrackVolume,
        addBlock,
        removeBlock,
        moveBlock,
        resizeBlock,
        currentMeasure,
        playbackPosition,
        isTimelinePlaying,
        toggleTimelinePlayback,
        selectedTrackId,
        setSelectedTrackId,
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
