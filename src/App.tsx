import { useState, useCallback, useRef } from 'react'
import { DebugDrawer } from '@/components/organisms/DebugDrawer'
import { LandscapeLayout } from '@/components/templates/LandscapeLayout'
import { DrumPadPage } from '@/components/pages/DrumPadPage'
import { SynthPage } from '@/components/pages/SynthPage'
import { Button } from '@/components/ui/button'
import { Volume2 } from 'lucide-react'
import { AudioProvider, SequencerProvider, useAudio } from '@/contexts'
import { SWIPE_THRESHOLD } from '@/constants'
import { cn } from '@/lib/utils'

// Main app content (needs to be inside providers)
function AppContent() {
  const [currentPage, setCurrentPage] = useState(0) // 0 = drums, 1 = synth
  const { init, needsInit, isLoading } = useAudio()

  // Swipe tracking
  const touchStartX = useRef<number | null>(null)

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
        {/* Swipeable page container */}
        <div
          className="flex-1 overflow-hidden relative"
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
              <DrumPadPage onNavigate={setCurrentPage} />
            </div>

            {/* Synth Page */}
            <div className="w-full h-full flex-shrink-0">
              <SynthPage onNavigate={setCurrentPage} />
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

export default App
