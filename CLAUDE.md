# CLAUDE.md - AI Assistant Guide for poc-drum-pad

This document provides guidance for AI assistants working on this codebase.

## Project Overview

**poc-drum-pad** is a proof-of-concept drum pad and audio sequencer web application. This is an artsy, fun prototype for exploring interactive audio functionality in the browser.

### Key Features

- **Drum Pads**: Trigger drum sounds via touch/click
- **Audio Sequencer**: Create and playback drum patterns
- **Mobile-First**: Optimized for mobile devices in landscape orientation

### Project Status

This project is in the **initial setup phase**.

## Technology Stack

| Category | Technology |
|----------|------------|
| **Language** | TypeScript |
| **Framework** | React |
| **Build Tool** | Vite |
| **Styling** | Tailwind CSS |
| **UI Components** | shadcn/ui |
| **Deployment** | Netlify |
| **Package Manager** | npm |

## Repository Structure

```
poc-drum-pad/
├── src/
│   ├── components/          # React components (Atomic Design)
│   │   ├── ui/              # shadcn/ui components
│   │   ├── atoms/           # Basic building blocks
│   │   ├── molecules/       # Combinations of atoms
│   │   ├── organisms/       # Complex UI sections
│   │   ├── templates/       # Page layouts
│   │   └── pages/           # Full page components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities and helpers
│   ├── audio/               # Web Audio API logic
│   ├── types/               # TypeScript type definitions
│   ├── App.tsx              # Root component
│   └── main.tsx             # Entry point
├── public/
│   └── sounds/              # Audio sample files
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── components.json          # shadcn/ui config
├── netlify.toml             # Netlify deployment config
└── CLAUDE.md
```

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Add shadcn/ui component
npx shadcn@latest add <component-name>
```

## Component Architecture (Atomic Design)

Follow Atomic Design principles for component organization:

### Atoms
Smallest, indivisible UI elements.
```
src/components/atoms/
├── DrumPad.tsx          # Single drum pad button
├── PlayButton.tsx       # Transport control button
├── BeatIndicator.tsx    # Single beat indicator light
└── VolumeSlider.tsx     # Volume control
```

### Molecules
Combinations of atoms that form functional units.
```
src/components/molecules/
├── PadRow.tsx           # Row of drum pads
├── TransportControls.tsx # Play/stop/tempo controls
├── SequencerTrack.tsx   # Single track in sequencer
└── PatternSelector.tsx  # Pattern selection UI
```

### Organisms
Complex UI sections composed of molecules.
```
src/components/organisms/
├── DrumPadGrid.tsx      # Full drum pad interface
├── Sequencer.tsx        # Complete sequencer grid
├── MixerPanel.tsx       # Volume/pan controls
└── Header.tsx           # App header/navigation
```

### Templates
Page-level layouts without specific content.
```
src/components/templates/
├── LandscapeLayout.tsx  # Main landscape layout
└── FullscreenLayout.tsx # Immersive mode layout
```

### Pages
Complete views with content.
```
src/components/pages/
├── DrumPadPage.tsx      # Main drum pad view
├── SequencerPage.tsx    # Sequencer view
└── SettingsPage.tsx     # App settings
```

## Coding Conventions

### File Naming

- Components: `PascalCase.tsx` (e.g., `DrumPad.tsx`)
- Hooks: `use-kebab-case.ts` (e.g., `use-audio-context.ts`)
- Utilities: `kebab-case.ts` (e.g., `audio-utils.ts`)
- Types: `kebab-case.types.ts` (e.g., `sequencer.types.ts`)

### Component Structure

```tsx
// Standard component template
import { cn } from '@/lib/utils';

interface DrumPadProps {
  sound: string;
  onTrigger: () => void;
  className?: string;
}

export function DrumPad({ sound, onTrigger, className }: DrumPadProps) {
  return (
    <button
      className={cn('...base styles...', className)}
      onPointerDown={onTrigger}
    >
      {/* content */}
    </button>
  );
}
```

### Code Style

- Use 2-space indentation
- Use single quotes for strings
- Add trailing commas in multi-line structures
- Prefer `const` over `let`; avoid `var`
- Use named exports for components
- Colocate component-specific types in the same file

### Tailwind Conventions

- Use Tailwind classes directly in components
- Extract repeated patterns to component variants using `cva` (class-variance-authority)
- Use `cn()` utility for conditional classes
- Follow mobile-first responsive design

## Mobile-First & Landscape Design

### Viewport Considerations

- Primary target: mobile devices in landscape orientation
- Design for touch interaction (large tap targets, 44px minimum)
- Consider safe areas for notched devices
- Optimize for one-handed landscape use

### Responsive Breakpoints

```tsx
// Tailwind breakpoints
// sm: 640px   - Large phones landscape
// md: 768px   - Tablets
// lg: 1024px  - Desktop
// xl: 1280px  - Large desktop

// Example: landscape-first approach
<div className="grid grid-cols-4 landscape:grid-cols-8">
```

### Touch Interactions

- Use `onPointerDown` for immediate response (not `onClick`)
- Implement touch feedback with visual/haptic response
- Prevent default touch behaviors where needed
- Support multi-touch for simultaneous pad triggers

## Audio Architecture

### Web Audio API Patterns

```typescript
// src/audio/audio-engine.ts
class AudioEngine {
  private context: AudioContext | null = null;
  private buffers: Map<string, AudioBuffer> = new Map();

  // Initialize on user interaction (required for iOS)
  async init(): Promise<void> {
    this.context = new AudioContext();
    await this.loadSamples();
  }

  // Trigger a sound with minimal latency
  play(soundId: string): void {
    if (!this.context) return;
    const buffer = this.buffers.get(soundId);
    if (!buffer) return;

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.context.destination);
    source.start(0);
  }
}
```

### Mobile Audio Considerations

1. **iOS Restrictions**: AudioContext must be created/resumed after user interaction
2. **Latency**: Use `AudioBufferSourceNode` for lowest latency
3. **Preloading**: Load all samples before allowing playback
4. **Background**: Handle audio context suspension when app is backgrounded

### Sequencer Timing

```typescript
// Use Web Audio API scheduling for precise timing
const scheduleAhead = 0.1; // seconds
const lookAhead = 25; // milliseconds

function scheduler() {
  while (nextNoteTime < audioContext.currentTime + scheduleAhead) {
    scheduleNote(currentNote, nextNoteTime);
    nextNote();
  }
  setTimeout(scheduler, lookAhead);
}
```

## shadcn/ui Integration

### Adding Components

```bash
# Add a button component
npx shadcn@latest add button

# Add slider for volume control
npx shadcn@latest add slider

# Add dialog for settings
npx shadcn@latest add dialog
```

### Customizing for Drum Pad

- Modify components in `src/components/ui/` as needed
- Use CSS variables for theming
- Extend with Tailwind for custom styles

## Deployment (Netlify)

### Build Settings

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Environment Variables

- Set in Netlify dashboard for production
- Use `.env.local` for local development (gitignored)

## Git Workflow

### Branch Naming

- Features: `feature/description`
- Bug fixes: `fix/description`
- Documentation: `docs/description`

### Commit Messages

- Use imperative mood: "Add drum pad component"
- Keep subject under 50 characters
- Reference issues when applicable

## Important Notes for AI Assistants

1. **Mobile-First**: Always consider touch interactions and landscape layout first.

2. **Low Latency**: Audio responsiveness is critical. Use Web Audio API best practices.

3. **Atomic Design**: Place components in the correct atomic level. When unsure, start lower (atom) and compose up.

4. **shadcn/ui First**: Check if shadcn/ui has a suitable component before building custom.

5. **No Over-Engineering**: This is a proof-of-concept. Keep it simple and fun.

6. **iOS Audio**: Always handle the iOS audio context restriction (user interaction required).

7. **Visual Feedback**: Every pad trigger should have immediate visual feedback.

## Resources

- [Web Audio API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Vite](https://vitejs.dev/)
- [Atomic Design](https://atomicdesign.bradfrost.com/)
- [Netlify Docs](https://docs.netlify.com/)
