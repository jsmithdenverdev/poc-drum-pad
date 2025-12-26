import { useState, useCallback, useRef, useEffect } from 'react'
import { DrumPadPage } from '@/components/pages/DrumPadPage'
import { SynthPage } from '@/components/pages/SynthPage'
import { DebugDrawer } from '@/components/organisms/DebugDrawer'
import { LandscapeLayout } from '@/components/templates/LandscapeLayout'
import { Button } from '@/components/ui/button'
import { Volume2 } from 'lucide-react'
import { useAudioEngine } from '@/hooks/use-audio-engine'
import { useSequencer } from '@/hooks/use-sequencer'
import { soundUrls } from '@/audio/sounds'
import { cn } from '@/lib/utils'
import type { DrumSound, SequencerPattern, SoundType } from '@/types/audio.types'

// Drum sounds
const DEFAULT_SOUNDS: DrumSound[] = [
  { id: 'kick', name: 'Kick', url: soundUrls.kick, color: '#ef4444', key: '1' },
  { id: 'snare', name: 'Snare', url: soundUrls.snare, color: '#f97316', key: '2' },
  { id: 'hihat', name: 'Hi-Hat', url: soundUrls.hihat, color: '#eab308', key: '3' },
  { id: 'clap', name: 'Clap', url: soundUrls.clap, color: '#22c55e', key: '4' },
  { id: 'tom1', name: 'Tom 1', url: soundUrls.tom1, color: '#14b8a6', key: 'q' },
  { id: 'tom2', name: 'Tom 2', url: soundUrls.tom2, color: '#3b82f6', key: 'w' },
  { id: 'crash', name: 'Crash', url: soundUrls.crash, color: '#8b5cf6', key: 'e' },
  { id: 'ride', name: 'Ride', url: soundUrls.ride, color: '#ec4899', key: 'r' },
]

// Initial pattern with drum tracks only (synth tracks added dynamically)
const DEFAULT_PATTERN: SequencerPattern = {
  id: 'default',
  name: 'Pattern 1',
  bpm: 120,
  tracks: DEFAULT_SOUNDS.map(sound => ({
    soundId: sound.id,
    soundType: 'drum' as const,
    steps: Array(16).fill(null).map(() => ({ active: false })),
  })),
}

// Swipe threshold in pixels
const SWIPE_THRESHOLD = 50

function App() {
  const [currentPage, setCurrentPage] = useState(0) // 0 = drums, 1 = synth
  const [pattern, setPattern] = useState<SequencerPattern>(DEFAULT_PATTERN)

  // Swipe tracking
  const touchStartX = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Audio engine (shared)
  const { init, play, playSynth, needsInit, isLoading } = useAudioEngine(DEFAULT_SOUNDS)

  // Sequencer (shared)
  const { isPlaying, currentStep, bpm, toggle, setBpm } = useSequencer(pattern)

  // Update sequencer when pattern changes
  useEffect(() => {
    // The useSequencer hook handles this internally
  }, [pattern])

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
        // Swipe right - go to previous page
        setCurrentPage(prev => prev - 1)
      } else if (diff < 0 && currentPage < 1) {
        // Swipe left - go to next page
        setCurrentPage(prev => prev + 1)
      }
    }

    touchStartX.current = null
  }, [currentPage])

  // Toggle sound on step (with sound type)
  const toggleSoundOnStep = useCallback((soundId: string, stepIndex: number, soundType: SoundType) => {
    setPattern(prev => {
      // Check if track exists for this sound
      const trackIndex = prev.tracks.findIndex(t => t.soundId === soundId)

      if (trackIndex >= 0) {
        // Track exists - toggle the step
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
        // Track doesn't exist - create it with the step active
        const newTrack = {
          soundId,
          soundType,
          steps: Array(16).fill(null).map((_, sIdx) => ({
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

  // Clear only drum tracks
  const clearDrumTracks = useCallback(() => {
    setPattern(prev => ({
      ...prev,
      tracks: prev.tracks.map(track =>
        track.soundType === 'drum'
          ? { ...track, steps: track.steps.map(() => ({ active: false })) }
          : track
      ),
    }))
  }, [])

  // Clear only synth tracks
  const clearSynthTracks = useCallback(() => {
    setPattern(prev => ({
      ...prev,
      tracks: prev.tracks.filter(track => track.soundType !== 'synth'),
    }))
  }, [])

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
        ref={containerRef}
        className="relative w-full h-full overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pages container - slides horizontally */}
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentPage * 100}%)` }}
        >
          {/* Drum Pad Page */}
          <div className="w-full h-full flex-shrink-0">
            <DrumPadPage
              sounds={DEFAULT_SOUNDS}
              pattern={pattern}
              isPlaying={isPlaying}
              currentStep={currentStep}
              bpm={bpm}
              onPlay={play}
              onToggle={toggle}
              onSetBpm={setBpm}
              onToggleSoundOnStep={(soundId, stepIndex) => toggleSoundOnStep(soundId, stepIndex, 'drum')}
              onClearPattern={clearDrumTracks}
            />
          </div>

          {/* Synth Page */}
          <div className="w-full h-full flex-shrink-0">
            <SynthPage
              pattern={pattern}
              isPlaying={isPlaying}
              currentStep={currentStep}
              bpm={bpm}
              onPlaySynth={playSynth}
              onToggle={toggle}
              onSetBpm={setBpm}
              onToggleSoundOnStep={toggleSoundOnStep}
              onClearSynthTracks={clearSynthTracks}
            />
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

      <DebugDrawer />
    </>
  )
}

export default App
