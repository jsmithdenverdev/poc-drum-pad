import { useState, useCallback, useRef } from 'react'
import { DebugDrawer } from '@/components/organisms/DebugDrawer'
import { StepSequencer } from '@/components/organisms/StepSequencer'
import { DrumPadGrid } from '@/components/organisms/DrumPadGrid'
import { PianoKeyboard } from '@/components/organisms/PianoKeyboard'
import { LandscapeLayout } from '@/components/templates/LandscapeLayout'
import { SequencerConfig } from '@/components/molecules/SequencerConfig'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { PlayButton } from '@/components/atoms/PlayButton'
import { Volume2, Settings, Trash2 } from 'lucide-react'
import { useAudioEngine } from '@/hooks/use-audio-engine'
import { useSequencer } from '@/hooks/use-sequencer'
import { soundUrls } from '@/audio/sounds'
import { SYNTH_NOTES } from '@/audio/synth-engine'
import { cn } from '@/lib/utils'
import type { DrumSound, SequencerPattern, SoundType, StepCount } from '@/types/audio.types'

// Drum sounds
const DRUM_SOUNDS: DrumSound[] = [
  { id: 'kick', name: 'Kick', url: soundUrls.kick, color: '#ef4444', key: '1' },
  { id: 'snare', name: 'Snare', url: soundUrls.snare, color: '#f97316', key: '2' },
  { id: 'hihat', name: 'Hi-Hat', url: soundUrls.hihat, color: '#eab308', key: '3' },
  { id: 'clap', name: 'Clap', url: soundUrls.clap, color: '#22c55e', key: '4' },
  { id: 'tom1', name: 'Tom 1', url: soundUrls.tom1, color: '#14b8a6', key: 'q' },
  { id: 'tom2', name: 'Tom 2', url: soundUrls.tom2, color: '#3b82f6', key: 'w' },
  { id: 'crash', name: 'Crash', url: soundUrls.crash, color: '#8b5cf6', key: 'e' },
  { id: 'ride', name: 'Ride', url: soundUrls.ride, color: '#ec4899', key: 'r' },
]

// Synth sounds for sequencer display (all white keys get purple color)
const SYNTH_SOUNDS_FOR_DISPLAY: DrumSound[] = SYNTH_NOTES.map(note => ({
  id: note.id,
  name: note.note,
  url: '',
  color: '#a855f7', // Purple for synth notes
}))

// Combined sounds for sequencer color lookup
const ALL_SOUNDS_FOR_DISPLAY: DrumSound[] = [...DRUM_SOUNDS, ...SYNTH_SOUNDS_FOR_DISPLAY]

// Maximum steps - always store this many to preserve data when changing step count
const MAX_STEPS = 32

// Initial pattern with drum tracks only (synth tracks added dynamically)
const DEFAULT_PATTERN: SequencerPattern = {
  id: 'default',
  name: 'Pattern 1',
  bpm: 120,
  tracks: DRUM_SOUNDS.map(sound => ({
    soundId: sound.id,
    soundType: 'drum' as const,
    steps: Array(MAX_STEPS).fill(null).map(() => ({ active: false })),
  })),
}

// Swipe threshold in pixels
const SWIPE_THRESHOLD = 50

function App() {
  const [currentPage, setCurrentPage] = useState(0) // 0 = drums, 1 = synth
  const [pattern, setPattern] = useState<SequencerPattern>(DEFAULT_PATTERN)
  const [showSequencer, setShowSequencer] = useState(false)
  const [selectedStep, setSelectedStep] = useState<number | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  // Swipe tracking
  const touchStartX = useRef<number | null>(null)

  // Audio engine (shared)
  const { init, play, playSynth, needsInit, isLoading } = useAudioEngine(DRUM_SOUNDS)

  // Sequencer (shared)
  const {
    isPlaying,
    currentStep,
    bpm,
    stepCount,
    hiddenTracks,
    toggle,
    setBpm,
    setStepCount,
    toggleTrackVisibility,
  } = useSequencer(pattern)

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

  // Handle step selection
  const handleStepSelect = useCallback((stepIndex: number) => {
    setSelectedStep(prev => prev === stepIndex ? null : stepIndex)
  }, [])

  // Toggle sound on step (with sound type)
  const toggleSoundOnStep = useCallback((soundId: string, stepIndex: number, soundType: SoundType) => {
    setPattern(prev => {
      const trackIndex = prev.tracks.findIndex(t => t.soundId === soundId)

      if (trackIndex >= 0) {
        return {
          ...prev,
          tracks: prev.tracks.map((track, idx) => {
            if (idx !== trackIndex) return track
            return {
              ...track,
              steps: track.steps.map((step, sIdx) => {
                if (sIdx !== stepIndex) return step
                return { ...step, active: !step.active }
              }),
            }
          }),
        }
      } else {
        const newTrack = {
          soundId,
          soundType,
          steps: Array(MAX_STEPS).fill(null).map((_, sIdx) => ({
            active: sIdx === stepIndex
          })),
        }
        return {
          ...prev,
          tracks: [...prev.tracks, newTrack],
        }
      }
    })
  }, [])

  // Handle step count change - only changes display/playback, data always has MAX_STEPS
  const handleStepCountChange = useCallback((newCount: StepCount) => {
    setStepCount(newCount)
    // Ensure all tracks have MAX_STEPS (in case of legacy data)
    setPattern(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => {
        if (track.steps.length >= MAX_STEPS) return track
        // Extend to MAX_STEPS if needed
        const newSteps = Array(MAX_STEPS - track.steps.length).fill(null).map(() => ({ active: false }))
        return { ...track, steps: [...track.steps, ...newSteps] }
      }),
    }))
    // Clear selected step if it's beyond new count
    if (selectedStep !== null && selectedStep >= newCount) {
      setSelectedStep(null)
    }
  }, [setStepCount, selectedStep])

  // Clear all tracks
  const clearPattern = useCallback(() => {
    setPattern(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        steps: track.steps.map(() => ({ active: false })),
      })),
    }))
  }, [])

  // Handle drum pad trigger
  const handleDrumTrigger = useCallback((soundId: string) => {
    play(soundId)
    if (showSequencer && selectedStep !== null && !isPlaying) {
      toggleSoundOnStep(soundId, selectedStep, 'drum')
    }
  }, [play, showSequencer, selectedStep, isPlaying, toggleSoundOnStep])

  // Handle synth trigger
  const handleSynthTrigger = useCallback((noteId: string) => {
    playSynth(noteId)
    if (showSequencer && selectedStep !== null && !isPlaying) {
      toggleSoundOnStep(noteId, selectedStep, 'synth')
    }
  }, [playSynth, showSequencer, selectedStep, isPlaying, toggleSoundOnStep])

  // Handle init button
  const handleInit = useCallback(async () => {
    await init()
  }, [init])

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
        {/* Static Header */}
        <header className="flex-shrink-0 px-4 py-2 border-b border-border">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">
              {currentPage === 0 ? 'Drum Pad' : 'Synth'}
            </h1>
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
              {showSequencer && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(!showSettings)}
                  className={cn(showSettings && 'bg-secondary')}
                >
                  <Settings className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Settings panel - collapsible */}
        {showSequencer && showSettings && (
          <div className="flex-shrink-0 px-4 py-3 border-b border-border bg-secondary/30">
            <SequencerConfig
              bpm={bpm}
              stepCount={stepCount}
              tracks={DRUM_SOUNDS}
              hiddenTracks={hiddenTracks}
              onBpmChange={setBpm}
              onStepCountChange={handleStepCountChange}
              onToggleTrackVisibility={toggleTrackVisibility}
              className="max-w-lg mx-auto"
            />
          </div>
        )}

        {/* Static Sequencer - shows all tracks */}
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
          className="flex-1 overflow-hidden relative"
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
              <PianoKeyboard onTrigger={handleSynthTrigger} className="w-full max-w-2xl" />
            </div>
          </div>

          {/* Page indicator dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
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
                aria-label={index === 0 ? 'Drum Pad' : 'Synth'}
              />
            ))}
          </div>
        </div>
      </div>

      <DebugDrawer />
    </>
  )
}

export default App
