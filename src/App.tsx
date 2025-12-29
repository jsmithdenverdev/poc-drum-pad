import { useState, useCallback, useRef, useMemo } from 'react'
import { DebugDrawer } from '@/components/organisms/DebugDrawer'
import { AudioErrorBoundary } from '@/components/organisms/AudioErrorBoundary'
import { LandscapeLayout } from '@/components/templates/LandscapeLayout'
import { DrumPadGrid } from '@/components/organisms/DrumPadGrid'
import { PianoKeyboard } from '@/components/organisms/PianoKeyboard'
import { StepSequencer } from '@/components/organisms/StepSequencer'
import { Timeline } from '@/components/organisms/Timeline'
import { PatternPickerModal } from '@/components/organisms/PatternPickerModal'
import { SavePatternModal } from '@/components/organisms/SavePatternModal'
import { SequencerConfig } from '@/components/molecules/SequencerConfig'
import { SynthConfig } from '@/components/molecules/SynthConfig'
import { PatternSelector } from '@/components/molecules/PatternSelector'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { PlayButton } from '@/components/atoms/PlayButton'
import { Volume2, AlertTriangle, RefreshCw, Menu, Trash2, Save, Check, SkipBack, Square } from 'lucide-react'
import { AudioProvider, SequencerProvider, useAudio, useSequencerContext, TimelineProvider, useTimelineContext } from '@/contexts'
import type { TimelineBlock, SavedPattern } from '@/types/audio.types'
import { SWIPE_THRESHOLD, DRUM_SOUNDS, ALL_SOUNDS_FOR_DISPLAY } from '@/constants'
import { PRESET_PATTERNS } from '@/constants/preset-patterns'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { cn } from '@/lib/utils'

// Main app content (needs to be inside providers)
function AppContent() {
  const [currentInstrumentPage, setCurrentInstrumentPage] = useState(0) // 0 = drums, 1 = synth
  const [currentSequencerPage, setCurrentSequencerPage] = useState(0) // 0 = sequencer, 1 = timeline
  const {
    init,
    needsInit,
    isLoading,
    hasError,
    error,
    play,
    noteOn,
    noteOff,
    synthSettings,
    handleWaveformChange,
    handleOctaveChange,
    handleDetuneChange,
    handleAttackChange,
    handleReleaseChange,
    handleFilterChange,
  } = useAudio()

  const {
    pattern,
    isPlaying,
    currentStep,
    bpm,
    stepCount,
    hiddenTracks,
    toggle,
    setBpm,
    toggleTrackVisibility,
    setTrackVolume,
    selectedSteps,
    showSettings,
    setShowSettings,
    toggleSoundOnSteps,
    clearPattern,
    handleStepSelect,
    handleStepCountChange,
    loadPattern,
    copyStep,
    pasteStep,
    undo,
    redo,
  } = useSequencerContext()

  const {
    timeline,
    savedPatterns,
    savePattern,
    playbackPosition,
    isTimelinePlaying,
    selectedTrackId,
    setSelectedTrackId,
    selectedBlock,
    setSelectedBlock,
    addTrack,
    removeTrack,
    toggleTrackMute,
    addBlock,
    removeBlock,
    moveBlock,
    resizeBlock,
    toggleTimelinePlayback,
    stopTimeline,
    restartTimeline,
    scenes,
    selectedSceneId,
    setSelectedSceneId,
    addScene,
    removeScene,
    duplicateScene,
  } = useTimelineContext()

  // Pattern picker modal state
  const [patternPickerOpen, setPatternPickerOpen] = useState(false)
  const [pendingBlockPlacement, setPendingBlockPlacement] = useState<{
    trackId: string
    measure: number
  } | null>(null)
  const [justSaved, setJustSaved] = useState(false)
  const [saveModalOpen, setSaveModalOpen] = useState(false)

  // Swipe tracking for instruments
  const instrumentTouchStartX = useRef<number | null>(null)
  // Swipe tracking for sequencer/timeline
  const sequencerTouchStartX = useRef<number | null>(null)

  // Create track volumes Map from pattern
  const trackVolumes = useMemo(() => {
    const volumes = new Map<string, number>()
    pattern.tracks.forEach(track => {
      volumes.set(track.soundId, track.volume ?? 1)
    })
    return volumes
  }, [pattern.tracks])

  // Handle drum trigger
  const handleDrumTrigger = useCallback((soundId: string) => {
    play(soundId)
    if (selectedSteps.size > 0 && !isPlaying) {
      toggleSoundOnSteps(soundId, [...selectedSteps], 'drum')
    }
  }, [play, selectedSteps, isPlaying, toggleSoundOnSteps])

  // Handle synth note on
  const handleNoteOn = useCallback((noteId: string) => {
    noteOn(noteId)
    if (selectedSteps.size > 0 && !isPlaying) {
      toggleSoundOnSteps(noteId, [...selectedSteps], 'synth')
    }
  }, [noteOn, selectedSteps, isPlaying, toggleSoundOnSteps])

  // Handle synth note off
  const handleNoteOff = useCallback((noteId: string) => {
    noteOff(noteId)
  }, [noteOff])

  // Handle copy/paste (copy from first selected, paste to all selected)
  const handleCopy = useCallback(() => {
    const firstStep = [...selectedSteps][0]
    if (firstStep !== undefined) copyStep(firstStep)
  }, [selectedSteps, copyStep])

  const handlePaste = useCallback(() => {
    selectedSteps.forEach(step => pasteStep(step))
  }, [selectedSteps, pasteStep])

  // Keyboard shortcuts (only active on drum page)
  useKeyboardShortcuts({
    onTrigger: currentInstrumentPage === 0 ? handleDrumTrigger : undefined,
    onUndo: undo,
    onRedo: redo,
    onCopy: handleCopy,
    onPaste: handlePaste,
    enabled: true,
  })

  // Handle instrument touch start
  const handleInstrumentTouchStart = useCallback((e: React.TouchEvent) => {
    instrumentTouchStartX.current = e.touches[0].clientX
  }, [])

  // Handle instrument touch end
  const handleInstrumentTouchEnd = useCallback((e: React.TouchEvent) => {
    if (instrumentTouchStartX.current === null) return

    const touchEndX = e.changedTouches[0].clientX
    const diff = touchEndX - instrumentTouchStartX.current

    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0 && currentInstrumentPage > 0) {
        setCurrentInstrumentPage(prev => prev - 1)
      } else if (diff < 0 && currentInstrumentPage < 1) {
        setCurrentInstrumentPage(prev => prev + 1)
      }
    }

    instrumentTouchStartX.current = null
  }, [currentInstrumentPage])

  // Handle sequencer/timeline touch start - edge-only for timeline (has internal scroll)
  const handleSequencerTouchStart = useCallback((e: React.TouchEvent) => {
    const touchX = e.touches[0].clientX

    // Timeline has internal scrolling, so only allow swipe from edges
    if (currentSequencerPage === 1) {
      const target = e.currentTarget as HTMLElement
      const rect = target.getBoundingClientRect()
      const edgeThreshold = 50 // pixels from edge to trigger swipe

      const isNearLeftEdge = touchX - rect.left < edgeThreshold
      const isNearRightEdge = rect.right - touchX < edgeThreshold

      if (isNearLeftEdge || isNearRightEdge) {
        sequencerTouchStartX.current = touchX
      } else {
        sequencerTouchStartX.current = null
      }
    } else {
      // Sequencer allows swipe from anywhere
      sequencerTouchStartX.current = touchX
    }
  }, [currentSequencerPage])

  // Handle sequencer/timeline touch end
  const handleSequencerTouchEnd = useCallback((e: React.TouchEvent) => {
    if (sequencerTouchStartX.current === null) return

    const touchEndX = e.changedTouches[0].clientX
    const diff = touchEndX - sequencerTouchStartX.current

    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0 && currentSequencerPage > 0) {
        setCurrentSequencerPage(prev => prev - 1)
      } else if (diff < 0 && currentSequencerPage < 1) {
        setCurrentSequencerPage(prev => prev + 1)
      }
    }

    sequencerTouchStartX.current = null
  }, [currentSequencerPage])

  // Save current pattern to library
  const handleSaveClick = useCallback(() => {
    setSaveModalOpen(true)
  }, [])

  const handleSavePattern = useCallback((name: string) => {
    savePattern(pattern, name)
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 1500)
  }, [savePattern, pattern])

  // Timeline handlers
  const handleTimelineCellClick = useCallback((trackId: string, measure: number) => {
    setPendingBlockPlacement({ trackId, measure })
    setPatternPickerOpen(true)
  }, [])

  const handlePatternSelect = useCallback((pattern: SavedPattern) => {
    if (pendingBlockPlacement) {
      addBlock(pendingBlockPlacement.trackId, pattern.id, pendingBlockPlacement.measure)
    }
    setPatternPickerOpen(false)
    setPendingBlockPlacement(null)
  }, [pendingBlockPlacement, addBlock])

  const handlePatternPickerClose = useCallback(() => {
    setPatternPickerOpen(false)
    setPendingBlockPlacement(null)
  }, [])

  const handleTimelineBlockClick = useCallback((_trackId: string, block: TimelineBlock) => {
    setSelectedBlock(block)
  }, [setSelectedBlock])

  const handleBlockDelete = useCallback((trackId: string, blockId: string) => {
    removeBlock(trackId, blockId)
  }, [removeBlock])

  const handleBlockMove = useCallback((trackId: string, blockId: string, deltaMeasures: number) => {
    // Find the block to get its current position
    const track = timeline.tracks.find(t => t.id === trackId)
    const block = track?.blocks.find(b => b.id === blockId)
    if (block) {
      const newStart = Math.max(0, block.startMeasure + deltaMeasures)
      moveBlock(trackId, blockId, newStart)
    }
  }, [timeline.tracks, moveBlock])

  const handleBlockResize = useCallback((trackId: string, blockId: string, deltaMeasures: number) => {
    // Find the block to get its current length
    const track = timeline.tracks.find(t => t.id === trackId)
    const block = track?.blocks.find(b => b.id === blockId)
    if (block) {
      const newLength = Math.max(1, block.lengthMeasures + deltaMeasures)
      resizeBlock(trackId, blockId, newLength)
    }
  }, [timeline.tracks, resizeBlock])

  // Scene handlers
  const handleSceneSelect = useCallback((sceneId: string) => {
    setSelectedSceneId(sceneId)
  }, [setSelectedSceneId])

  const handleAddScene = useCallback(() => {
    addScene()
  }, [addScene])

  const handleDuplicateScene = useCallback((sceneId: string) => {
    duplicateScene(sceneId)
  }, [duplicateScene])

  const handleDeleteScene = useCallback((sceneId: string) => {
    removeScene(sceneId)
  }, [removeScene])

  // Handle init button
  const handleInit = useCallback(async () => {
    await init()
  }, [init])

  const instrumentNames = ['Drum Pad', 'Synth']
  const sequencerViewNames = ['Sequencer', 'Timeline']

  // Show init screen if audio not ready
  if (needsInit) {
    return (
      <LandscapeLayout>
        <div className="flex flex-col items-center justify-center gap-8 p-8 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Drum Pad & Synth</h1>
            <p className="text-sm text-muted-foreground max-w-sm">
              Tap to start. Audio requires user interaction on mobile devices.
            </p>
          </div>
          <Button size="lg" onClick={handleInit} className="gap-2 shadow-lg shadow-primary/20">
            <Volume2 className="w-5 h-5" />
            Start Audio
          </Button>
        </div>
      </LandscapeLayout>
    )
  }

  if (isLoading) {
    return (
      <LandscapeLayout>
        <div className="flex items-center justify-center">
          <p className="text-muted-foreground">Loading sounds...</p>
        </div>
      </LandscapeLayout>
    )
  }

  // Show error UI if audio initialization failed
  if (hasError) {
    return (
      <LandscapeLayout>
        <div className="flex flex-col items-center justify-center gap-6 p-8 text-center max-w-md mx-auto">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Audio Error</h1>
            <p className="text-muted-foreground">
              Unable to initialize audio. This may happen if audio permissions are denied or the device doesn't support Web Audio.
            </p>
          </div>

          {error && (
            <details className="w-full text-left">
              <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                Technical details
              </summary>
              <pre className="mt-2 p-3 bg-secondary rounded-md text-xs text-foreground overflow-auto max-h-32">
                {error.message}
              </pre>
            </details>
          )}

          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              onClick={handleInit}
              variant="default"
              className="gap-2 flex-1 sm:flex-initial"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="gap-2 flex-1 sm:flex-initial"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Page
            </Button>
          </div>
        </div>
      </LandscapeLayout>
    )
  }

  return (
    <>
      <div
        className="h-full w-full flex flex-col"
        style={{
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Header - static */}
        <header className="flex-shrink-0 px-4 py-3 border-b border-border/50 bg-secondary/30">
          <div className="flex items-center justify-between">
            {/* Left side - Menu button and title */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(!showSettings)}
                className={cn(
                  'rounded-lg transition-colors',
                  showSettings && 'bg-primary/20 text-primary'
                )}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-semibold tracking-tight">{instrumentNames[currentInstrumentPage]}</h1>
            </div>

            {/* Right side - Controls */}
            <div className="flex items-center gap-1">
              {/* Timeline transport controls */}
              {currentSequencerPage === 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={restartTimeline}
                    title="Restart"
                    className="rounded-lg text-muted-foreground hover:text-foreground h-8 w-8"
                  >
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={stopTimeline}
                    title="Stop"
                    className="rounded-lg text-muted-foreground hover:text-foreground h-8 w-8"
                  >
                    <Square className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
              <PlayButton
                isPlaying={currentSequencerPage === 0 ? isPlaying : isTimelinePlaying}
                onToggle={currentSequencerPage === 0 ? toggle : toggleTimelinePlayback}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSaveClick}
                title="Save pattern to library"
                className={cn(
                  'rounded-lg transition-colors',
                  justSaved
                    ? 'text-green-500 bg-green-500/10'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {justSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearPattern}
                title="Clear pattern"
                className="rounded-lg text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Settings drawer */}
        <Sheet open={showSettings} onOpenChange={setShowSettings}>
          <SheetContent side="left" className="overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle>Settings</SheetTitle>
              <SheetDescription>
                Configure sequencer and instrument settings
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6">
              {/* Patterns Section */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                  Patterns
                </h3>
                <PatternSelector
                  patterns={PRESET_PATTERNS}
                  currentPatternId={pattern.id}
                  onSelectPattern={loadPattern}
                />
              </section>

              {/* Sequencer Section */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                  Sequencer
                </h3>
                <SequencerConfig
                  bpm={bpm}
                  stepCount={stepCount}
                  tracks={DRUM_SOUNDS}
                  hiddenTracks={hiddenTracks}
                  trackVolumes={trackVolumes}
                  onBpmChange={setBpm}
                  onStepCountChange={handleStepCountChange}
                  onToggleTrackVisibility={toggleTrackVisibility}
                  onTrackVolumeChange={setTrackVolume}
                />
              </section>

              {/* Synth Section */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                  Synth
                </h3>
                <SynthConfig
                  settings={synthSettings}
                  onWaveformChange={handleWaveformChange}
                  onOctaveChange={handleOctaveChange}
                  onDetuneChange={handleDetuneChange}
                  onAttackChange={handleAttackChange}
                  onReleaseChange={handleReleaseChange}
                  onFilterChange={handleFilterChange}
                />
              </section>
            </div>
          </SheetContent>
        </Sheet>

        {/* Swipeable Sequencer/Timeline area */}
        <div
          className="flex-shrink-0 border-b border-border/50 bg-secondary/20 overflow-hidden relative"
          onTouchStart={handleSequencerTouchStart}
          onTouchEnd={handleSequencerTouchEnd}
        >
          {/* Sequencer/Timeline container - slides horizontally */}
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${currentSequencerPage * 100}%)` }}
          >
            {/* Step Sequencer */}
            <div className="w-full flex-shrink-0 py-4">
              <StepSequencer
                pattern={pattern}
                sounds={ALL_SOUNDS_FOR_DISPLAY}
                selectedSteps={selectedSteps}
                currentStep={currentStep}
                isPlaying={isPlaying}
                stepCount={stepCount}
                hiddenTracks={hiddenTracks}
                onStepSelect={handleStepSelect}
              />
            </div>

            {/* Timeline */}
            <div className="w-full flex-shrink-0 py-4">
              <Timeline
                timeline={timeline}
                savedPatterns={savedPatterns}
                playbackPosition={playbackPosition}
                isPlaying={isTimelinePlaying}
                selectedTrackId={selectedTrackId}
                selectedBlockId={selectedBlock?.id ?? null}
                onTrackSelect={setSelectedTrackId}
                onAddTrack={() => addTrack()}
                onDeleteTrack={removeTrack}
                onToggleMute={toggleTrackMute}
                onCellClick={handleTimelineCellClick}
                onBlockClick={handleTimelineBlockClick}
                onBlockDelete={handleBlockDelete}
                onBlockMove={handleBlockMove}
                onBlockResize={handleBlockResize}
                scenes={scenes}
                selectedSceneId={selectedSceneId}
                onSceneSelect={handleSceneSelect}
                onAddScene={handleAddScene}
                onDuplicateScene={handleDuplicateScene}
                onDeleteScene={handleDeleteScene}
              />
            </div>
          </div>

          {/* Sequencer/Timeline page indicator dots */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {[0, 1].map(index => (
              <button
                key={index}
                className={cn(
                  'h-1 rounded-full transition-all duration-200',
                  currentSequencerPage === index
                    ? 'bg-primary w-4'
                    : 'bg-muted-foreground/40 w-1 hover:bg-muted-foreground/60',
                )}
                onClick={() => setCurrentSequencerPage(index)}
                aria-label={sequencerViewNames[index]}
              />
            ))}
          </div>
        </div>

        {/* Swipeable instrument area */}
        <div
          className="flex-1 overflow-hidden relative min-h-0"
          onTouchStart={handleInstrumentTouchStart}
          onTouchEnd={handleInstrumentTouchEnd}
        >
          {/* Instruments container - slides horizontally */}
          <div
            className="flex h-full transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${currentInstrumentPage * 100}%)` }}
          >
            {/* Drum Pads */}
            <div className="w-full h-full flex-shrink-0 flex items-center justify-center">
              <DrumPadGrid sounds={DRUM_SOUNDS} onTrigger={handleDrumTrigger} />
            </div>

            {/* Piano Keyboard */}
            <div className="w-full h-full flex-shrink-0 flex items-center justify-center p-4">
              <PianoKeyboard
                onNoteOn={handleNoteOn}
                onNoteOff={handleNoteOff}
                className="w-full max-w-2xl"
              />
            </div>
          </div>

          {/* Page indicator dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10 bg-secondary/60 backdrop-blur-sm rounded-full px-3 py-1.5">
            {[0, 1].map(index => (
              <button
                key={index}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-200',
                  currentInstrumentPage === index
                    ? 'bg-primary w-5'
                    : 'bg-muted-foreground/40 w-1.5 hover:bg-muted-foreground/60',
                )}
                onClick={() => setCurrentInstrumentPage(index)}
                aria-label={instrumentNames[index]}
              />
            ))}
          </div>
        </div>
      </div>

      <DebugDrawer />

      {/* Pattern Picker Modal */}
      <PatternPickerModal
        open={patternPickerOpen}
        onClose={handlePatternPickerClose}
        onSelectPattern={handlePatternSelect}
        savedPatterns={savedPatterns}
        trackName={pendingBlockPlacement ? timeline.tracks.find(t => t.id === pendingBlockPlacement.trackId)?.name : undefined}
        measureNumber={pendingBlockPlacement?.measure}
      />

      {/* Save Pattern Modal */}
      <SavePatternModal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onSave={handleSavePattern}
        defaultName={pattern.name}
      />
    </>
  )
}

// Root App component with providers
function App() {
  return (
    <AudioProvider>
      <SequencerProvider>
        <TimelineProvider>
          <AppContent />
        </TimelineProvider>
      </SequencerProvider>
    </AudioProvider>
  )
}

// Wrap with error boundary for graceful error handling
function AppWithErrorBoundary() {
  return (
    <AudioErrorBoundary>
      <App />
    </AudioErrorBoundary>
  )
}

export default AppWithErrorBoundary
