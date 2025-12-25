# CLAUDE.md - AI Assistant Guide for poc-drum-pad

This document provides guidance for AI assistants working on this codebase.

## Project Overview

**poc-drum-pad** is a proof-of-concept drum pad web application. This is a prototype project for exploring interactive audio functionality in the browser.

### Project Status

This project is in the **initial setup phase**. The repository currently contains only infrastructure files (.gitignore, README.md) and no source code has been implemented yet.

## Technology Stack (Planned)

Based on the project configuration, the following technologies are expected:

- **Runtime**: Node.js
- **Language**: TypeScript (recommended)
- **Build Tool**: Vite (inferred from .gitignore)
- **Package Manager**: npm or yarn

## Repository Structure

```
poc-drum-pad/
├── .git/              # Git repository
├── .gitignore         # Node.js/JavaScript gitignore
├── CLAUDE.md          # This file - AI assistant guide
└── README.md          # Project description
```

### Planned Structure (when implemented)

```
poc-drum-pad/
├── src/               # Source code
│   ├── components/    # UI components
│   ├── audio/         # Audio handling logic
│   ├── styles/        # CSS/styling
│   └── main.ts        # Entry point
├── public/            # Static assets (audio samples, etc.)
├── tests/             # Test files
├── package.json       # Dependencies and scripts
├── tsconfig.json      # TypeScript configuration
├── vite.config.ts     # Vite build configuration
└── index.html         # HTML entry point
```

## Development Commands

Once the project is set up, expect these common commands:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

## Key Concepts for a Drum Pad Application

When implementing features, consider:

1. **Web Audio API**: Use the Web Audio API for low-latency audio playback
2. **Touch/Click Events**: Handle both mouse and touch inputs for pad triggers
3. **Keyboard Mapping**: Map keyboard keys to drum pads for desktop users
4. **Sample Loading**: Preload audio samples for responsive playback
5. **Visual Feedback**: Provide visual feedback when pads are triggered

## Coding Conventions

### General Guidelines

- Use TypeScript for type safety
- Prefer functional components if using a framework
- Keep audio logic separate from UI logic
- Write self-documenting code; add comments only where logic isn't obvious

### File Naming

- Use kebab-case for file names: `drum-pad.ts`, `audio-engine.ts`
- Use PascalCase for component files if using React/Vue: `DrumPad.tsx`
- Test files should mirror source files: `audio-engine.test.ts`

### Code Style

- Use 2-space indentation
- Use single quotes for strings
- Add trailing commas in multi-line structures
- Prefer `const` over `let`; avoid `var`

## Git Workflow

### Branch Naming

- Feature branches: `feature/description`
- Bug fixes: `fix/description`
- Documentation: `docs/description`

### Commit Messages

Write clear, concise commit messages:
- Use imperative mood: "Add drum pad component" not "Added drum pad component"
- Keep the subject line under 50 characters
- Add body for complex changes

## Testing Guidelines

When tests are implemented:

- Write unit tests for audio logic
- Write integration tests for user interactions
- Test keyboard and touch/mouse inputs
- Test audio playback (mocked in unit tests)

## Audio Handling Best Practices

For a drum pad application:

1. **AudioContext**: Create a single AudioContext and reuse it
2. **Buffer Loading**: Load audio buffers once at startup
3. **Latency**: Minimize latency by using `AudioBufferSourceNode`
4. **Mobile Support**: Handle iOS audio restrictions (require user interaction to start audio)

Example pattern:
```typescript
// Initialize audio context on user interaction
let audioContext: AudioContext | null = null;

function initAudio() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}
```

## Common Tasks

### Adding a New Drum Pad Sound

1. Add the audio file to `public/sounds/`
2. Register the sound in the audio configuration
3. Map the sound to a pad in the UI

### Modifying Pad Layout

1. Update the pad configuration
2. Adjust CSS grid/flex layout as needed
3. Update keyboard mappings if applicable

## Environment Setup

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

### Initial Setup (when project is initialized)

```bash
# Clone the repository
git clone <repository-url>
cd poc-drum-pad

# Install dependencies
npm install

# Start development server
npm run dev
```

## Important Notes for AI Assistants

1. **Early Stage Project**: This is a proof-of-concept. Focus on simplicity and rapid iteration over perfect architecture.

2. **No Over-Engineering**: Keep implementations simple. Avoid adding unnecessary abstractions or features not explicitly requested.

3. **Audio Complexity**: Web audio can be tricky. Always consider browser compatibility and mobile restrictions.

4. **User Experience**: Drum pads need to feel responsive. Prioritize low-latency interactions.

5. **Testing Audio**: Audio functionality is difficult to unit test. Focus on testing the logic around audio (timing, mapping) rather than actual audio output.

## Resources

- [Web Audio API MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Vite Documentation](https://vitejs.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
