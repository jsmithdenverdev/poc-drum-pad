# Frontend Code Review Backlog

> **Generated:** 2024-12-27
> **Reviewer:** Claude Code Review Agent
> **Branch:** `claude/frontend-code-review-mzhVu`
> **Codebase Version:** Commit 4be5cf1

This document contains prioritized improvement items identified during the comprehensive frontend code review of the poc-drum-pad application. Items are organized by category and priority, with detailed implementation guidance for sub-agents.

---

## Table of Contents

1. [Priority Legend](#priority-legend)
2. [Architecture & Code Organization](#architecture--code-organization)
3. [Audio Implementation](#audio-implementation)
4. [State Management](#state-management)
5. [Component Quality](#component-quality)
6. [Performance Optimization](#performance-optimization)
7. [UX & Accessibility](#ux--accessibility)
8. [Type Safety](#type-safety)
9. [Testing & Quality Assurance](#testing--quality-assurance)
10. [Feature Enhancements](#feature-enhancements)

---

## Priority Legend

| Priority | Description | Effort |
|----------|-------------|--------|
| P0 | Critical - Blocking issues or major bugs | - |
| P1 | High - Significantly improves code quality | S/M/L |
| P2 | Medium - Good to have improvements | S/M/L |
| P3 | Low - Nice to have, future consideration | S/M/L |

Effort (T-Shirt Sizing): **S** = Small, **M** = Medium, **L** = Large, **XL** = Extra Large

---

## Director Decisions (2024-12-27)

| Question | Decision |
|----------|----------|
| Unused page components | **Keep and refactor** - Introduce incremental route-based rendering |
| Sound asset strategy | **Keep base64 only** - Delete public/sounds, prefer offline support |
| Test priority | **Audio engine first** - Focus on complex audio logic |
| Sprint ordering | **Approved** as proposed |

---

## Architecture & Code Organization

### ARCH-001: Decompose App.tsx Monolith
**Priority:** P1 | **Effort:** M

**Current State:**
- `src/App.tsx` is ~420 lines containing mixed concerns
- Constants, state management, handlers, and UI all in one file
- Makes maintenance and testing difficult

**Implementation Details:**
```
Files to create/modify:
├── src/constants/
│   ├── sounds.ts          # DRUM_SOUNDS constant
│   ├── synth-notes.ts     # SYNTH_NOTES display config
│   └── index.ts           # Re-exports
├── src/hooks/
│   └── use-pattern.ts     # Pattern state management hook
├── src/components/organisms/
│   └── InstrumentCarousel.tsx  # Swipeable instrument area
└── src/App.tsx            # Simplified orchestration only
```

**Tasks:**
1. Extract `DRUM_SOUNDS` array to `src/constants/sounds.ts`
2. Extract `SYNTH_SOUNDS_FOR_DISPLAY` and `ALL_SOUNDS_FOR_DISPLAY` to `src/constants/synth-notes.ts`
3. Extract `MAX_STEPS`, `SWIPE_THRESHOLD`, `DEFAULT_PATTERN` to constants
4. Create `usePattern` hook for pattern state management (steps, clearing, toggling)
5. Create `InstrumentCarousel` organism for swipeable drum/synth pages
6. Refactor App.tsx to compose these modules

**Acceptance Criteria:**
- App.tsx is under 150 lines
- All constants are importable from `@/constants`
- Pattern logic is encapsulated in a dedicated hook
- No functionality changes - all existing features work identically

---

### ARCH-002: Implement Route-Based Page Rendering
**Priority:** P1 | **Effort:** M | **Decision:** Keep and refactor pages

**Current State:**
- `src/components/pages/DrumPadPage.tsx` exists but is unused
- `src/components/pages/SynthPage.tsx` exists but is unused
- App.tsx contains all page logic inline

**Implementation Details:**
Introduce state-based routing using the existing page components:

```typescript
// src/contexts/AudioContext.tsx (NEW)
interface AudioContextValue {
  sounds: DrumSound[]
  pattern: SequencerPattern
  setPattern: (pattern: SequencerPattern) => void
  isPlaying: boolean
  currentStep: number
  // ... shared state
}

export const AudioContext = createContext<AudioContextValue | null>(null)

// src/App.tsx - Simplified orchestration
function App() {
  const [currentPage, setCurrentPage] = useState<'drums' | 'synth'>('drums')

  return (
    <AudioProvider>
      <SequencerProvider>
        {currentPage === 'drums' ? (
          <DrumPadPage onNavigate={setCurrentPage} />
        ) : (
          <SynthPage onNavigate={setCurrentPage} />
        )}
      </SequencerProvider>
    </AudioProvider>
  )
}
```

**Tasks:**
1. Create `AudioContext` for shared audio engine state
2. Create `SequencerContext` for shared sequencer state
3. Create `PatternContext` for pattern state management
4. Refactor `DrumPadPage` to consume contexts
5. Refactor `SynthPage` to consume contexts
6. Simplify App.tsx to orchestration only
7. Add navigation callback between pages

**Acceptance Criteria:**
- Page components fully functional with context
- App.tsx under 100 lines
- Swipe navigation still works
- All existing functionality preserved

---

### ARCH-003: Consolidate Sound Asset Strategy
**Priority:** P1 | **Effort:** S | **Decision:** Keep base64 only

**Current State:**
- Audio samples exist in TWO locations:
  - `public/sounds/*.wav` (680KB total)
  - `src/audio/sounds.ts` as base64 data URLs (923KB)
- This is wasteful duplication

**Implementation Details:**
Delete public/sounds directory, keep base64 for offline support:

```bash
# Remove public sound files
rm -rf public/sounds/
```

**Tasks:**
1. Delete `public/sounds/` directory
2. Verify audio still works with base64 sources
3. Update any documentation referencing public sounds

**Acceptance Criteria:**
- `public/sounds/` directory removed
- Audio plays correctly from base64 sources
- No broken references in codebase

---

## Audio Implementation

### AUDIO-001: Consolidate Audio Context Resume Logic
**Priority:** P1 | **Effort:** M

**Current State:**
Resume logic is duplicated across:
- `audio-engine.ts:70-93` - `resume()` method
- `audio-engine.ts:136-152` - in `play()` method
- `use-audio-engine.ts:26-35` - `handleInteraction`
- `sequencer.ts:54-65` - in `start()` method

**Implementation Details:**
```typescript
// src/audio/audio-context-manager.ts (NEW)
class AudioContextManager {
  private context: AudioContext | null = null
  private resumePromise: Promise<void> | null = null

  async ensureRunning(): Promise<boolean> {
    if (!this.context) return false
    if (this.context.state === 'running') return true

    // Deduplicate concurrent resume attempts
    if (!this.resumePromise) {
      this.resumePromise = this.context.resume()
        .finally(() => { this.resumePromise = null })
    }

    await this.resumePromise
    return this.context.state === 'running'
  }
}
```

**Tasks:**
1. Create `AudioContextManager` class with centralized resume logic
2. Refactor `AudioEngine` to use manager
3. Refactor `Sequencer` to use manager via audioEngine
4. Simplify `useAudioEngine` hook to remove duplicate logic
5. Add proper error handling for resume failures

**Acceptance Criteria:**
- Single source of truth for resume logic
- All components use the same resume path
- No race conditions on concurrent resume calls

---

### AUDIO-002: Add Polyphony Support to Synth
**Priority:** P3 | **Effort:** M

**Current State:**
- Synth plays one-shot notes only
- No tracking of active notes
- No note-off support for sustained playing

**Implementation Details:**
```typescript
// Enhanced SynthEngine
class SynthEngine {
  private activeNotes: Map<string, {
    oscillator: OscillatorNode
    envelope: GainNode
  }> = new Map()

  noteOn(noteId: string): void { /* ... */ }
  noteOff(noteId: string): void { /* ... */ }

  // For keyboard: track held keys
  // For sequencer: use current one-shot behavior
}
```

**Tasks:**
1. Add `activeNotes` tracking to SynthEngine
2. Implement `noteOn()` and `noteOff()` methods
3. Update PianoKey to use pointer up for note-off
4. Keep one-shot behavior for sequencer playback

**Acceptance Criteria:**
- Piano keys sustain while held
- Release triggers proper envelope release
- Sequencer continues to work with one-shot notes

---

### AUDIO-003: Implement Keyboard Shortcuts for Drums
**Priority:** P2 | **Effort:** S

**Current State:**
- `DRUM_SOUNDS` defines keyboard shortcuts (`key` property)
- Keyboard shortcuts are NOT implemented
- Keys defined: 1, 2, 3, 4, q, w, e, r

**Implementation Details:**
```typescript
// Add to App.tsx or create useKeyboardShortcuts hook
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const sound = DRUM_SOUNDS.find(s => s.key === e.key.toLowerCase())
    if (sound) {
      e.preventDefault()
      handleDrumTrigger(sound.id)
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [handleDrumTrigger])
```

**Tasks:**
1. Create `useKeyboardShortcuts` hook in `src/hooks/`
2. Map key events to drum triggers
3. Add visual feedback on keyboard press (same as touch)
4. Handle key repeat (debounce rapid triggers)
5. Add keyboard hint in UI or tooltip

**Acceptance Criteria:**
- Keys 1-4 and q-w-e-r trigger corresponding drum sounds
- Visual feedback matches touch interaction
- No duplicate triggers from key repeat

---

## State Management

### STATE-001: Add Pattern Persistence
**Priority:** P1 | **Effort:** M

**Current State:**
- Patterns are stored in React state only
- All work is lost on page refresh
- No save/load functionality

**Implementation Details:**
```typescript
// src/hooks/use-pattern-storage.ts
const STORAGE_KEY = 'drum-pad-pattern'

export function usePatternStorage() {
  const savePattern = useCallback((pattern: SequencerPattern) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pattern))
  }, [])

  const loadPattern = useCallback((): SequencerPattern | null => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  }, [])

  // Auto-save on pattern changes
  const [pattern, setPattern] = useState<SequencerPattern>(() => {
    return loadPattern() ?? DEFAULT_PATTERN
  })

  useEffect(() => {
    savePattern(pattern)
  }, [pattern, savePattern])

  return { pattern, setPattern }
}
```

**Tasks:**
1. Create `usePatternStorage` hook
2. Initialize pattern from localStorage on mount
3. Auto-save pattern on every change
4. Handle storage errors gracefully
5. Add clear/reset functionality
6. Consider debouncing saves for performance

**Acceptance Criteria:**
- Pattern survives page refresh
- Works on mobile browsers
- Graceful degradation if storage unavailable

---

### STATE-002: Refactor Singleton Pattern for Testability
**Priority:** P3 | **Effort:** L

**Current State:**
- `audioEngine`, `synthEngine`, `sequencer` are singletons
- Makes unit testing difficult
- Tight coupling between modules

**Implementation Details:**
```typescript
// Dependency injection approach
interface AudioEngineInterface {
  init(sounds: DrumSound[]): Promise<void>
  play(soundId: string): Promise<void>
  // ... etc
}

// Context provider for React
const AudioContext = createContext<AudioEngineInterface | null>(null)

function AudioProvider({ children }: { children: React.ReactNode }) {
  const engine = useMemo(() => new AudioEngine(), [])
  return (
    <AudioContext.Provider value={engine}>
      {children}
    </AudioContext.Provider>
  )
}
```

**Tasks:**
1. Define interfaces for AudioEngine, SynthEngine, Sequencer
2. Create context providers for each
3. Refactor hooks to consume contexts instead of importing singletons
4. Create mock implementations for testing
5. Update App to wrap with providers

**Acceptance Criteria:**
- No direct singleton imports in components
- All dependencies injectable via context
- Mock implementations available for tests

---

## Component Quality

### COMP-001: Optimize StepSequencer Rendering
**Priority:** P2 | **Effort:** S

**Current State:**
`StepSequencer.tsx:32-41` - `getActiveSoundsForStep` creates new arrays on every render:
```typescript
const getActiveSoundsForStep = (stepIndex: number): string[] => {
  const colors: string[] = []  // New array every call
  pattern.tracks.forEach(track => { /* ... */ })
  return colors
}
```

**Implementation Details:**
```typescript
// Use useMemo for computed step colors
const stepColors = useMemo(() => {
  return Array.from({ length: stepCount }, (_, stepIndex) => {
    const colors: string[] = []
    pattern.tracks.forEach(track => {
      if (track.steps[stepIndex]?.active && !hiddenTracks.has(track.soundId)) {
        const color = soundColorMap.get(track.soundId)
        if (color) colors.push(color)
      }
    })
    return colors
  })
}, [pattern.tracks, stepCount, hiddenTracks, soundColorMap])

// In render:
<StepButton activeSoundColors={stepColors[stepIndex]} />
```

**Tasks:**
1. Memoize `soundColorMap` with useMemo
2. Compute all step colors once per pattern change
3. Add React.memo to StepButton if not already memoized
4. Profile with React DevTools to verify improvement

**Acceptance Criteria:**
- No array creation during render
- Pattern changes still reflect immediately
- Smoother animation during playback

---

### COMP-002: Replace setTimeout with CSS for DrumPad Feedback
**Priority:** P2 | **Effort:** S

**Current State:**
`DrumPad.tsx:16-18` uses setTimeout for visual feedback:
```typescript
const handleTrigger = useCallback(() => {
  setIsActive(true)
  onTrigger(id)
  setTimeout(() => setIsActive(false), 100)  // JS-based timing
}, [id, onTrigger])
```

**Implementation Details:**
```typescript
// Option A: CSS animation
<button
  className={cn(
    'animate-trigger',  // CSS handles the reset
    // ...
  )}
  onAnimationEnd={() => setIsActive(false)}
/>

// In CSS:
@keyframes trigger {
  0% { transform: scale(0.95); filter: brightness(1.25); }
  100% { transform: scale(1); filter: brightness(1); }
}
.animate-trigger { animation: trigger 100ms ease-out; }

// Option B: Transition with auto-reset
// Just rely on CSS transition and remove active state after animation
```

**Tasks:**
1. Add CSS keyframe animation for trigger effect
2. Use `onAnimationEnd` event instead of setTimeout
3. Remove isActive state if using pure CSS approach
4. Test on mobile for smooth performance

**Acceptance Criteria:**
- Same visual feedback as before
- No JavaScript timing involved
- Works smoothly on 60fps mobile devices

---

### COMP-003: Memoize PianoKeyboard Position Calculations
**Priority:** P2 | **Effort:** S

**Current State:**
`PianoKeyboard.tsx:18-29` calculates black key positions on every render:
```typescript
const getBlackKeyPosition = (note: string, whiteKeyWidth: number): number => {
  const blackKeyPositions: Record<string, number> = {
    'C#4': 0, 'D#4': 1, 'F#4': 3, 'G#4': 4, 'A#4': 5,
  }
  // Calculations...
}
```

**Implementation Details:**
```typescript
// Move to module level or useMemo
const BLACK_KEY_POSITIONS: Record<string, number> = {
  'C#4': 0, 'D#4': 1, 'F#4': 3, 'G#4': 4, 'A#4': 5,
}

// Precompute percentages
const whiteKeyWidth = 100 / 8  // 8 white keys, constant
const BLACK_KEY_LEFT_POSITIONS = Object.fromEntries(
  Object.entries(BLACK_KEY_POSITIONS).map(([note, index]) => [
    note,
    index * whiteKeyWidth + (whiteKeyWidth * 0.75)
  ])
)
```

**Tasks:**
1. Move constants to module level
2. Precompute all percentage positions
3. Use lookup instead of calculation in render
4. Add React.memo to PianoKey component

**Acceptance Criteria:**
- No calculations during render
- Positions are static/memoized
- Component renders faster

---

## Performance Optimization

### PERF-001: Lazy Load Audio Samples
**Priority:** P2 | **Effort:** M

**Current State:**
- All 8 drum samples loaded at once during init
- If using base64, 923KB parsed at startup
- Blocks audio readiness

**Implementation Details:**
```typescript
// Progressive loading with priority
async loadSounds(sounds: DrumSound[]): Promise<void> {
  // Load most common sounds first (kick, snare, hihat)
  const priority = ['kick', 'snare', 'hihat']
  const prioritySounds = sounds.filter(s => priority.includes(s.id))
  const otherSounds = sounds.filter(s => !priority.includes(s.id))

  // Load priority sounds first
  await Promise.all(prioritySounds.map(s => this.loadSound(s)))
  this.setState('ready')  // Ready with essential sounds

  // Load remaining in background
  Promise.all(otherSounds.map(s => this.loadSound(s)))
}
```

**Tasks:**
1. Identify priority sounds (kick, snare, hihat)
2. Load priority sounds first, then mark as ready
3. Load remaining sounds in background
4. Show loading indicator for sounds not yet loaded
5. Handle play request for unloaded sound (queue or skip)

**Acceptance Criteria:**
- App becomes interactive faster
- Essential sounds available first
- Clear feedback when sounds still loading

---

### PERF-002: Add React.memo to Pure Components
**Priority:** P2 | **Effort:** S

**Current State:**
Components that could benefit from memoization:
- `StepButton` - receives same props most of the time
- `DrumPad` - only needs to update on trigger
- `PianoKey` - rarely changes props
- `PlayButton` - only isPlaying changes

**Implementation Details:**
```typescript
// Example for StepButton
export const StepButton = memo(function StepButton({
  stepIndex,
  isSelected,
  isCurrentStep,
  activeSoundColors,
  onSelect,
  className,
}: StepButtonProps) {
  // ... existing implementation
}, (prevProps, nextProps) => {
  // Custom comparison if needed
  return (
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isCurrentStep === nextProps.isCurrentStep &&
    prevProps.stepIndex === nextProps.stepIndex &&
    arraysEqual(prevProps.activeSoundColors, nextProps.activeSoundColors)
  )
})
```

**Tasks:**
1. Wrap `StepButton` with React.memo
2. Wrap `DrumPad` with React.memo
3. Wrap `PianoKey` with React.memo
4. Add custom comparison functions where beneficial
5. Profile to verify fewer re-renders

**Acceptance Criteria:**
- Components only re-render when props change
- Verified with React DevTools Profiler
- No functionality changes

---

## UX & Accessibility

### UX-001: Add Error Boundary for Audio Failures
**Priority:** P1 | **Effort:** S

**Current State:**
- Audio init failures show in console only
- No user-facing error handling
- App may be in broken state after error

**Implementation Details:**
```typescript
// src/components/ErrorBoundary.tsx
class AudioErrorBoundary extends Component<Props, State> {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <h2>Audio Error</h2>
          <p>Unable to initialize audio. Please refresh the page.</p>
          <Button onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
```

**Tasks:**
1. Create `AudioErrorBoundary` component
2. Wrap App content with error boundary
3. Add recovery UI with refresh option
4. Log errors for debugging
5. Handle async errors (audio loading) with state

**Acceptance Criteria:**
- Users see clear error message on failure
- Recovery path available (refresh button)
- Errors logged for debugging

---

### UX-002: Add Loading States for Individual Sounds
**Priority:** P2 | **Effort:** S

**Current State:**
- Single "Loading sounds..." message during init
- No visibility into which sounds are loaded
- Pads may not work if specific sound failed

**Implementation Details:**
```typescript
// Track individual sound loading status
interface SoundStatus {
  id: string
  status: 'pending' | 'loading' | 'loaded' | 'error'
  error?: string
}

// Show in DrumPad
<DrumPad
  status={soundStatus[sound.id]}
  disabled={soundStatus[sound.id] !== 'loaded'}
/>
```

**Tasks:**
1. Add loading status tracking per sound
2. Surface status to DrumPad component
3. Show visual indicator for loading/error states
4. Disable interaction for unloaded sounds
5. Add retry option for failed sounds

**Acceptance Criteria:**
- Users know which sounds are ready
- Failed sounds clearly indicated
- Retry available for failures

---

### UX-003: Improve Accessibility with ARIA Labels
**Priority:** P2 | **Effort:** S

**Current State:**
Some components have ARIA labels, but incomplete:
- `StepButton` has good ARIA (line 47)
- `DrumPad` missing role and state info
- `PianoKey` missing role and state info
- Settings toggles missing labels

**Implementation Details:**
```typescript
// DrumPad improvements
<button
  role="button"
  aria-label={`${name} drum pad`}
  aria-pressed={isActive}
  // ...
/>

// PianoKey improvements
<button
  role="button"
  aria-label={`Piano key ${note}`}
  aria-pressed={isActive}
  // ...
/>
```

**Tasks:**
1. Add `role` attributes to interactive elements
2. Add descriptive `aria-label` to all buttons
3. Add `aria-pressed` for toggle states
4. Add `aria-live` regions for status updates
5. Test with screen reader

**Acceptance Criteria:**
- All interactive elements have proper ARIA
- Screen reader can navigate the app
- State changes announced appropriately

---

### UX-004: Add Haptic Feedback on Mobile
**Priority:** P3 | **Effort:** S

**Current State:**
- No haptic feedback when triggering pads
- Touch feels less responsive without tactile feedback

**Implementation Details:**
```typescript
// src/lib/haptics.ts
export function triggerHaptic(style: 'light' | 'medium' | 'heavy' = 'light') {
  if ('vibrate' in navigator) {
    const duration = { light: 10, medium: 25, heavy: 50 }
    navigator.vibrate(duration[style])
  }
}

// In DrumPad
const handleTrigger = useCallback(() => {
  triggerHaptic('light')
  onTrigger(id)
  // ...
}, [id, onTrigger])
```

**Tasks:**
1. Create haptics utility function
2. Add haptic to DrumPad trigger
3. Add haptic to PianoKey trigger
4. Add haptic to StepButton selection
5. Make haptics configurable (settings)

**Acceptance Criteria:**
- Haptic feedback on supported devices
- No errors on unsupported devices
- User can disable in settings

---

## Type Safety

### TYPE-001: Fix DrumSound Type Misuse
**Priority:** P2 | **Effort:** S

**Current State:**
`App.tsx:34-39` uses `DrumSound` type for non-drum sounds:
```typescript
const SYNTH_SOUNDS_FOR_DISPLAY: DrumSound[] = SYNTH_NOTES.map(note => ({
  id: note.id,
  name: note.note,
  url: '',  // Empty URL - not a real sound file
  color: '#a855f7',
}))
```

**Implementation Details:**
```typescript
// Create a more generic type
interface SoundDisplay {
  id: string
  name: string
  color: string
}

// DrumSound extends it
interface DrumSound extends SoundDisplay {
  url: string
  key?: string
}

// Use appropriate type
const SYNTH_SOUNDS_FOR_DISPLAY: SoundDisplay[] = SYNTH_NOTES.map(...)
const ALL_SOUNDS_FOR_DISPLAY: SoundDisplay[] = [...]
```

**Tasks:**
1. Create `SoundDisplay` base interface
2. Extend `DrumSound` from `SoundDisplay`
3. Update SYNTH_SOUNDS_FOR_DISPLAY type
4. Update StepSequencer to accept `SoundDisplay[]`
5. Fix any resulting type errors

**Acceptance Criteria:**
- No type coercion or empty properties
- Clear distinction between sound types
- TypeScript strict mode passes

---

### TYPE-002: Add Strict Event Handler Types
**Priority:** P3 | **Effort:** S

**Current State:**
Some event handlers use loose or implicit types:
```typescript
onValueChange={([v]) => onBpmChange(v)}  // v is inferred
onTrigger: (id: string) => void  // Could be more specific
```

**Implementation Details:**
```typescript
// Define specific callback types
type DrumTriggerHandler = (soundId: string) => void
type SynthTriggerHandler = (noteId: string) => void
type BpmChangeHandler = (bpm: number) => void
type StepSelectHandler = (stepIndex: number) => void

// Export from types
export type {
  DrumTriggerHandler,
  SynthTriggerHandler,
  // ...
}
```

**Tasks:**
1. Define callback types in `audio.types.ts`
2. Apply types to component props
3. Apply types to handler implementations
4. Ensure no `any` types remain

**Acceptance Criteria:**
- All callbacks have explicit types
- No implicit `any` in handler chains
- Better IDE autocomplete

---

## Testing & Quality Assurance

### TEST-001: Add Unit Tests for Audio Engine
**Priority:** P2 | **Effort:** L

**Current State:**
- No tests exist in the project
- Audio logic is complex and error-prone
- Regressions possible with changes

**Implementation Details:**
```typescript
// __tests__/audio/audio-engine.test.ts
import { AudioEngine } from '@/audio/audio-engine'

describe('AudioEngine', () => {
  let engine: AudioEngine
  let mockContext: jest.Mocked<AudioContext>

  beforeEach(() => {
    mockContext = createMockAudioContext()
    engine = new AudioEngine(mockContext)
  })

  describe('init', () => {
    it('should create audio context', async () => {
      await engine.init([])
      expect(engine.state).toBe('ready')
    })

    it('should load all provided sounds', async () => {
      const sounds = [mockDrumSound('kick')]
      await engine.init(sounds)
      expect(engine.hasSound('kick')).toBe(true)
    })
  })

  describe('play', () => {
    it('should resume context if suspended', async () => {
      mockContext.state = 'suspended'
      await engine.play('kick')
      expect(mockContext.resume).toHaveBeenCalled()
    })
  })
})
```

**Tasks:**
1. Set up Jest with TypeScript support
2. Create mock factories for Web Audio API
3. Write tests for AudioEngine methods
4. Write tests for SynthEngine methods
5. Write tests for Sequencer timing logic
6. Add to CI pipeline

**Acceptance Criteria:**
- Core audio logic has 80%+ coverage
- Tests run in CI on every PR
- No Web Audio API calls in tests (mocked)

---

### TEST-002: Add Component Tests
**Priority:** P2 | **Effort:** M

**Current State:**
- No component tests
- UI behavior untested
- Refactoring is risky

**Implementation Details:**
```typescript
// __tests__/components/DrumPad.test.tsx
import { render, fireEvent } from '@testing-library/react'
import { DrumPad } from '@/components/atoms/DrumPad'

describe('DrumPad', () => {
  it('should call onTrigger with id on pointer down', () => {
    const onTrigger = jest.fn()
    const { getByRole } = render(
      <DrumPad id="kick" name="Kick" color="#f00" onTrigger={onTrigger} />
    )

    fireEvent.pointerDown(getByRole('button'))
    expect(onTrigger).toHaveBeenCalledWith('kick')
  })

  it('should show active state on trigger', () => {
    // Test visual feedback
  })
})
```

**Tasks:**
1. Set up React Testing Library
2. Write tests for DrumPad component
3. Write tests for StepButton component
4. Write tests for StepSequencer component
5. Write integration tests for key flows

**Acceptance Criteria:**
- All atoms and molecules have tests
- Key user flows tested
- Visual regression testing considered

---

## Feature Enhancements

### FEAT-001: Pattern Library / Presets
**Priority:** P2 | **Effort:** M

**Description:**
Add ability to save multiple patterns and load preset patterns.

**Implementation Details:**
```typescript
// Pattern library structure
interface PatternLibrary {
  patterns: SequencerPattern[]
  activePatternId: string
}

// Preset patterns
const PRESET_PATTERNS: SequencerPattern[] = [
  { id: 'basic-rock', name: 'Basic Rock', bpm: 120, tracks: [...] },
  { id: 'disco', name: 'Disco', bpm: 110, tracks: [...] },
  // ...
]

// UI: Pattern selector dropdown/modal
```

**Tasks:**
1. Define preset patterns (5-10 common beats)
2. Create PatternSelector component
3. Add pattern switching logic
4. Persist pattern library to localStorage
5. Add create/delete pattern functionality

**Acceptance Criteria:**
- Users can select from preset patterns
- Users can save custom patterns
- Pattern library persists across sessions

---

### FEAT-002: Tap Tempo
**Priority:** P2 | **Effort:** S

**Description:**
Allow users to set BPM by tapping a button rhythmically.

**Implementation Details:**
```typescript
// src/hooks/use-tap-tempo.ts
export function useTapTempo(onBpmChange: (bpm: number) => void) {
  const taps = useRef<number[]>([])

  const tap = useCallback(() => {
    const now = Date.now()
    taps.current.push(now)

    // Keep last 4 taps
    if (taps.current.length > 4) {
      taps.current.shift()
    }

    // Calculate BPM from intervals
    if (taps.current.length >= 2) {
      const intervals = []
      for (let i = 1; i < taps.current.length; i++) {
        intervals.push(taps.current[i] - taps.current[i-1])
      }
      const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length
      const bpm = Math.round(60000 / avgInterval)
      onBpmChange(Math.max(60, Math.min(200, bpm)))
    }

    // Reset after 2 seconds of no taps
    setTimeout(() => {
      if (Date.now() - now > 2000) {
        taps.current = []
      }
    }, 2000)
  }, [onBpmChange])

  return { tap }
}
```

**Tasks:**
1. Create `useTapTempo` hook
2. Add tap tempo button to settings panel
3. Calculate BPM from tap intervals
4. Show visual feedback during tap sequence
5. Reset after timeout

**Acceptance Criteria:**
- Users can tap to set tempo
- BPM updates after 2+ taps
- Visual feedback shows tap is registered

---

### FEAT-003: Copy/Paste Steps
**Priority:** P3 | **Effort:** S

**Description:**
Allow copying a step's sounds to paste onto other steps.

**Implementation Details:**
```typescript
// Add to pattern state
interface PatternState {
  pattern: SequencerPattern
  clipboard: { soundIds: string[], soundTypes: SoundType[] } | null
}

// Actions
const copyStep = (stepIndex: number) => {
  const sounds = pattern.tracks
    .filter(t => t.steps[stepIndex].active)
    .map(t => ({ id: t.soundId, type: t.soundType }))
  setClipboard(sounds)
}

const pasteStep = (stepIndex: number) => {
  if (!clipboard) return
  // Add each sound to step
}
```

**Tasks:**
1. Add clipboard state to pattern management
2. Add copy action (long press or dedicated button)
3. Add paste action to selected step
4. Show paste indicator when clipboard has content
5. Add keyboard shortcuts (Ctrl+C, Ctrl+V)

**Acceptance Criteria:**
- Users can copy step sounds
- Users can paste to other steps
- Visual indicator shows clipboard status

---

### FEAT-004: Volume Per Track
**Priority:** P3 | **Effort:** M

**Description:**
Add individual volume control for each drum sound/synth.

**Implementation Details:**
```typescript
// Enhanced track with volume
interface SequencerTrack {
  soundId: string
  soundType: SoundType
  steps: SequencerStep[]
  volume: number  // 0-1
}

// Per-track gain node in audio engine
private trackGains: Map<string, GainNode> = new Map()

schedulePlay(soundId: string, time: number) {
  const gain = this.trackGains.get(soundId) ?? this.gainNode
  source.connect(gain)
  // ...
}
```

**Tasks:**
1. Add volume property to SequencerTrack type
2. Create GainNode per track in AudioEngine
3. Apply track volume when scheduling sounds
4. Add volume slider per track in settings
5. Persist volume settings

**Acceptance Criteria:**
- Each track has independent volume
- Volume changes apply immediately
- Volume persists with pattern

---

### FEAT-005: Undo/Redo for Pattern Editing
**Priority:** P3 | **Effort:** M

**Description:**
Add undo/redo capability for pattern changes.

**Implementation Details:**
```typescript
// src/hooks/use-pattern-history.ts
interface PatternHistory {
  past: SequencerPattern[]
  present: SequencerPattern
  future: SequencerPattern[]
}

export function usePatternHistory(initialPattern: SequencerPattern) {
  const [history, setHistory] = useState<PatternHistory>({
    past: [],
    present: initialPattern,
    future: [],
  })

  const undo = useCallback(() => {
    if (history.past.length === 0) return
    setHistory(h => ({
      past: h.past.slice(0, -1),
      present: h.past[h.past.length - 1],
      future: [h.present, ...h.future],
    }))
  }, [])

  const redo = useCallback(() => {
    if (history.future.length === 0) return
    setHistory(h => ({
      past: [...h.past, h.present],
      present: h.future[0],
      future: h.future.slice(1),
    }))
  }, [])

  return { pattern: history.present, setPattern, undo, redo, canUndo, canRedo }
}
```

**Tasks:**
1. Create `usePatternHistory` hook
2. Track pattern changes in history
3. Add undo/redo buttons to UI
4. Add keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z)
5. Limit history size (e.g., 50 states)

**Acceptance Criteria:**
- Users can undo pattern changes
- Users can redo undone changes
- History doesn't consume excessive memory

---

## Summary Statistics

| Category | P0 | P1 | P2 | P3 | Total |
|----------|---:|---:|---:|---:|------:|
| Architecture | 0 | 3 | 0 | 0 | 3 |
| Audio | 0 | 1 | 1 | 1 | 3 |
| State | 0 | 1 | 0 | 1 | 2 |
| Components | 0 | 0 | 3 | 0 | 3 |
| Performance | 0 | 0 | 2 | 0 | 2 |
| UX/A11y | 0 | 1 | 2 | 1 | 4 |
| Types | 0 | 0 | 1 | 1 | 2 |
| Testing | 0 | 1 | 1 | 0 | 2 |
| Features | 0 | 0 | 2 | 3 | 5 |
| **Total** | **0** | **7** | **12** | **7** | **26** |

---

## Recommended Sprint Order (Approved)

### Sprint 1: Foundation (P1 items) | Size: L
1. ARCH-003: Delete public/sounds (keep base64) | S
2. ARCH-001: Decompose App.tsx | M
3. ARCH-002: Implement route-based pages | M
4. AUDIO-001: Consolidate resume logic | M
5. STATE-001: Add pattern persistence | M
6. UX-001: Add error boundary | S
7. TEST-001: Set up audio engine tests | M

### Sprint 2: Quality (P2 core) | Size: M
1. COMP-001: Optimize StepSequencer | S
2. COMP-002: CSS-based DrumPad feedback | S
3. AUDIO-003: Keyboard shortcuts | S
4. UX-003: Accessibility improvements | S

### Sprint 3: Polish (P2 remaining) | Size: M
1. PERF-002: React.memo optimization | S
2. TYPE-001: Fix type misuse | S
3. FEAT-001: Pattern library | M
4. FEAT-002: Tap tempo | S

### Sprint 4: Future (P3) | Size: L
1. TEST-002: Component tests | M
2. Remaining P3 features as prioritized

---

## Sub-Agent Instructions

When implementing items from this backlog:

1. **Read the full item description** including current state, implementation details, and acceptance criteria
2. **Check related files** mentioned in the implementation section
3. **Run existing functionality** before making changes to understand current behavior
4. **Make incremental commits** with clear messages referencing the item ID (e.g., "ARCH-001: Extract DRUM_SOUNDS to constants")
5. **Test changes thoroughly** especially for audio-related items
6. **Update this document** to mark completed items and note any deviations from the plan

### Architect Agent Responsibilities

The architect agent should:
1. Prioritize items for sub-agents based on dependencies
2. Ensure sub-agents don't create conflicting changes
3. Review sub-agent implementations for consistency
4. Update this backlog as items complete or scope changes
5. Communicate blockers or scope changes to the director
