import { useState, useCallback, useRef, useMemo } from 'react'
import { DebugDrawer } from '@/components/organisms/DebugDrawer'
import { AudioErrorBoundary } from '@/components/organisms/AudioErrorBoundary'
import { LandscapeLayout } from '@/components/templates/LandscapeLayout'
import { DrumPadGrid } from '@/components/organisms/DrumPadGrid'
import { PianoKeyboard } from '@/components/organisms/PianoKeyboard'
import { StepSequencer } from '@/components/organisms/StepSequencer'
import { SequencerConfig } from '@/components/molecules/SequencerConfig'
import { SynthConfig } from '@/components/molecules/SynthConfig'
import { PatternSelector } from '@/components/molecules/PatternSelector'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { PlayButton } from '@/components/atoms/PlayButton'
import { Volume2, AlertTriangle, RefreshCw, Settings, Trash2 } from 'lucide-react'
import { AudioProvider, SequencerProvider, useAudio, useSequencerContext } from '@/contexts'
import { SWIPE_THRESHOLD, DRUM_SOUNDS, ALL_SOUNDS_FOR_DISPLAY } from '@/constants'
import { PRESET_PATTERNS } from '@/constants/preset-patterns'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { cn } from '@/lib/utils'

// Main app content (needs to be inside providers)
function AppContent() {
  const [currentPage, setCurrentPage] = useState(0) // 0 = drums, 1 = synth
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
    showSequencer,
    setShowSequencer,
    selectedStep,
    showSettings,
    setShowSettings,
    toggleSoundOnStep,
    clearPattern,
    handleStepSelect,
    handleStepCountChange,
    loadPattern,
    copyStep,
    pasteStep,
    undo,
    redo,
  } = useSequencerContext()

  // Swipe tracking
  const touchStartX = useRef<number | null>(null)

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
    if (showSequencer && selectedStep !== null && !isPlaying) {
      toggleSoundOnStep(soundId, selectedStep, 'drum')
    }
  }, [play, showSequencer, selectedStep, isPlaying, toggleSoundOnStep])

  // Handle synth note on
  const handleNoteOn = useCallback((noteId: string) => {
    noteOn(noteId)
    if (showSequencer && selectedStep !== null && !isPlaying) {
      toggleSoundOnStep(noteId, selectedStep, 'synth')
    }
  }, [noteOn, showSequencer, selectedStep, isPlaying, toggleSoundOnStep])

  // Handle synth note off
  const handleNoteOff = useCallback((noteId: string) => {
    noteOff(noteId)
  }, [noteOff])

  // Handle copy/paste
  const handleCopy = useCallback(() => {
    if (selectedStep !== null) copyStep(selectedStep)
  }, [selectedStep, copyStep])

  const handlePaste = useCallback(() => {
    if (selectedStep !== null) pasteStep(selectedStep)
  }, [selectedStep, pasteStep])

  // Keyboard shortcuts (only active on drum page)
  useKeyboardShortcuts({
    onTrigger: currentPage === 0 ? handleDrumTrigger : undefined,
    onUndo: undo,
    onRedo: redo,
    onCopy: handleCopy,
    onPaste: handlePaste,
    enabled: true,
  })

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }, [])

  // Handle touch end
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return

    const touchEndX = e.changedTouches[0].clientX
    const diff = touchEndX - touchStartX.current

    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0 && currentPage > 0) {
        setCurrentPage(prev => prev - 1)
      } else if (diff < 0 && currentPage < 1) {
        setCurrentPage(prev => prev + 1)
      }
    }

    touchStartX.current = null
  }, [currentPage])

  // Handle init button
  const handleInit = useCallback(async () => {
    await init()
  }, [init])

  const instrumentNames = ['Drum Pad', 'Synth']

  // Show init screen if audio not ready
  if (needsInit) {
    return (
      <LandscapeLayout>
        <div className="flex flex-col items-center justify-center gap-6 p-8 text-center">
          <h1 className="text-3xl font-bold">Drum Pad & Synth</h1>
          <p className="text-muted-foreground max-w-md">
            Tap the button below to start. Audio requires user interaction on mobile devices.
          </p>
          <Button size="lg" onClick={handleInit} className="gap-2">
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
        <header className="flex-shrink-0 px-4 py-2 border-b border-border">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">{instrumentNames[currentPage]}</h1>
            <div className="flex items-center gap-3">
              {/* Sequencer toggle */}
              <div className="flex items-center gap-2">
                <label
                  htmlFor="sequencer-toggle"
                  className="text-sm text-muted-foreground hidden sm:inline"
                >
                  Seq
                </label>
                <Switch
                  id="sequencer-toggle"
                  checked={showSequencer}
                  onCheckedChange={setShowSequencer}
                />
              </div>

              {/* Play button - only when sequencer is on */}
              {showSequencer && (
                <PlayButton isPlaying={isPlaying} onToggle={toggle} />
              )}

              {/* Clear button */}
              {showSequencer && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearPattern}
                  title="Clear pattern"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}

              {/* Settings button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(!showSettings)}
                className={cn(showSettings && 'bg-secondary')}
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Settings panel - static, collapsible */}
        {showSettings && (
          <div className="flex-shrink-0 px-4 py-3 border-b border-border bg-secondary/30 space-y-4">
            <div className="max-w-lg mx-auto space-y-4">
              {/* Pattern Selector - only when sequencer is on */}
              {showSequencer && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Preset Patterns
                  </label>
                  <PatternSelector
                    patterns={PRESET_PATTERNS}
                    currentPatternId={pattern.id}
                    onSelectPattern={loadPattern}
                  />
                </div>
              )}

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

              {/* Synth settings - only on synth page */}
              {currentPage === 1 && (
                <SynthConfig
                  settings={synthSettings}
                  onWaveformChange={handleWaveformChange}
                  onOctaveChange={handleOctaveChange}
                  onDetuneChange={handleDetuneChange}
                  onAttackChange={handleAttackChange}
                  onReleaseChange={handleReleaseChange}
                  onFilterChange={handleFilterChange}
                />
              )}
            </div>
          </div>
        )}

        {/* Sequencer - static above instruments */}
        {showSequencer && (
          <div className="flex-shrink-0 py-3 border-b border-border">
            <StepSequencer
              pattern={pattern}
              sounds={ALL_SOUNDS_FOR_DISPLAY}
              selectedStep={selectedStep}
              currentStep={currentStep}
              isPlaying={isPlaying}
              stepCount={stepCount}
              hiddenTracks={hiddenTracks}
              onStepSelect={handleStepSelect}
            />
          </div>
        )}

        {/* Swipeable instrument area */}
        <div
          className="flex-1 overflow-hidden relative min-h-0"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Instruments container - slides horizontally */}
          <div
            className="flex h-full transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${currentPage * 100}%)` }}
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
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {[0, 1].map(index => (
              <button
                key={index}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  currentPage === index
                    ? 'bg-primary w-4'
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50',
                )}
                onClick={() => setCurrentPage(index)}
                aria-label={instrumentNames[index]}
              />
            ))}
          </div>
        </div>
      </div>

      <DebugDrawer />
    </>
  )
}

// Root App component with providers
function App() {
  return (
    <AudioProvider>
      <SequencerProvider>
        <AppContent />
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
