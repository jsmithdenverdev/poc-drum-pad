# Timeline Feature Backlog

> **Feature:** GarageBand-style Timeline for Full Track Arrangement
> **Created:** 2024-12-28
> **Branch:** `claude/add-timeline-view-t4GKu`

This document tracks the implementation of the timeline feature, which allows users to arrange saved patterns into full tracks.

---

## Status Legend

| Status | Description |
|--------|-------------|
| ⬜ TODO | Not started |
| 🔄 IN PROGRESS | Currently being worked on |
| ✅ DONE | Completed |
| ❌ BLOCKED | Cannot proceed |

---

## Design Decisions

| Question | Decision |
|----------|----------|
| Track model | User-created, unlimited tracks |
| Block placement | Tap empty space → modal pattern picker |
| Block sizing | Supports looping & truncating |
| Snapping | Snap to measures, but allow movement |
| Block visual | Colored + pattern name (truncated) |
| Empty state | Onboarding message + "Add Track" button |
| Pattern picker UI | Modal from bottom |
| Max tracks | Unlimited |

---

## Phase 1: Layout & Static Display

Build the core timeline component structure with track rows, measure ruler, and block rendering.

### TIMELINE-001: Update Data Model Types
**Status:** ✅ DONE

Update `audio.types.ts` with the track-based timeline model:

```typescript
interface TimelineTrack {
  id: string
  name: string
  color: string
  muted: boolean
  volume: number
  blocks: TimelineBlock[]
}

interface Timeline {
  id: string
  name: string
  bpm: number
  tracks: TimelineTrack[]  // Changed from flat blocks array
}
```

**Files:** `src/types/audio.types.ts`

---

### TIMELINE-002: Update TimelineContext for Track Model
**Status:** ✅ DONE

Refactor TimelineContext to support the track-based model:
- Add `addTrack()`, `removeTrack()`, `updateTrack()` methods
- Update block methods to work within tracks
- Update localStorage persistence

**Files:** `src/contexts/TimelineContext.tsx`

---

### TIMELINE-003: Create Timeline Layout Component
**Status:** ✅ DONE

Build new Timeline component with:
- Track sidebar (50-60px wide)
- Measure ruler header
- Track rows with horizontal scroll
- Empty state UI

**Files:** `src/components/organisms/Timeline.tsx`

---

### TIMELINE-004: Create TimelineTrackRow Component
**Status:** ✅ DONE

Create component for individual track rows:
- Track info on left (name, color indicator)
- Grid cells for measures
- Block rendering within the row

**Files:** `src/components/molecules/TimelineTrackRow.tsx`

---

### TIMELINE-005: Create TimelineBlock Component
**Status:** ✅ DONE

Create component for pattern blocks:
- Colored background based on pattern
- Pattern name (truncated) in corner
- Width based on lengthMeasures
- Position based on startMeasure

**Files:** `src/components/atoms/TimelineBlock.tsx`

---

### TIMELINE-006: Create MeasureRuler Component
**Status:** ✅ DONE

Create measure number header:
- Shows measure numbers (1, 2, 3...)
- Highlights every 4th measure (bar lines)
- Scrolls with track content

**Files:** `src/components/atoms/MeasureRuler.tsx`

---

### TIMELINE-007: Create TimelineSidebar Component
**Status:** ✅ DONE

Create track sidebar:
- Track name/color for each track
- "+" button at bottom to add tracks
- Scrolls vertically with tracks

**Files:** `src/components/molecules/TimelineSidebar.tsx`

---

## Phase 2: Track Management

### TIMELINE-008: Add Track Creation
**Status:** ✅ DONE

Implement adding new tracks:
- "+" button in sidebar
- Default name: "Track 1", "Track 2", etc.
- Auto-assign color from palette

**Files:** `src/contexts/TimelineContext.tsx`, `src/components/molecules/TimelineSidebar.tsx`

---

### TIMELINE-009: Add Track Deletion
**Status:** ✅ DONE

Implement removing tracks:
- Delete button per track (in sidebar or on long-press)
- Confirmation if track has blocks

**Files:** `src/contexts/TimelineContext.tsx`, `src/components/molecules/TimelineSidebar.tsx`

---

### TIMELINE-010: Add Track Mute/Volume
**Status:** ✅ DONE

Implement track controls:
- Mute toggle per track
- Volume slider per track (in settings or sidebar)

**Files:** `src/contexts/TimelineContext.tsx`, `src/components/molecules/TimelineSidebar.tsx`

---

## Phase 3: Block Placement

### TIMELINE-011: Create PatternPickerModal
**Status:** ✅ DONE

Create modal for selecting patterns:
- Shows all saved patterns
- Pattern name and color
- Preview info (BPM, length)
- Tap to select

**Files:** `src/components/organisms/PatternPickerModal.tsx`

---

### TIMELINE-012: Implement Tap to Add Block
**Status:** ✅ DONE

Add block placement interaction:
- Tap empty cell in track row
- Opens PatternPickerModal
- On select, creates block at tapped measure
- Default length = pattern's natural length

**Files:** `src/components/organisms/Timeline.tsx`, `src/components/molecules/TimelineTrackRow.tsx`

---

### TIMELINE-013: Implement Block Deletion
**Status:** ✅ DONE

Add block deletion:
- Tap block to select
- Show delete button/option
- Remove block from track

**Files:** `src/components/atoms/TimelineBlock.tsx`, `src/contexts/TimelineContext.tsx`

---

## Phase 4: Block Editing

### TIMELINE-014: Implement Block Selection
**Status:** ⬜ TODO

Add block selection state:
- Tap block to select
- Visual highlight on selected block
- Only one block selected at a time

**Files:** `src/components/atoms/TimelineBlock.tsx`, `src/contexts/TimelineContext.tsx`

---

### TIMELINE-015: Implement Block Moving
**Status:** ⬜ TODO

Add block drag-to-move:
- Long-press or drag to start moving
- Visual feedback during drag
- Snap to measure on drop
- Prevent overlapping blocks

**Files:** `src/components/atoms/TimelineBlock.tsx`

---

### TIMELINE-016: Implement Block Resizing
**Status:** ⬜ TODO

Add block resize handles:
- Drag left/right edges
- Minimum 1 measure
- Visual feedback during resize
- Loops/truncates pattern accordingly

**Files:** `src/components/atoms/TimelineBlock.tsx`

---

## Phase 5: Playback

### TIMELINE-017: Implement Timeline Playback
**Status:** ⬜ TODO

Add timeline play functionality:
- Play button triggers timeline mode
- Reads blocks and schedules pattern playback
- Current measure indicator moves
- Loops at end or stops

**Files:** `src/contexts/TimelineContext.tsx`, `src/audio/timeline-player.ts`

---

### TIMELINE-018: Sync with Sequencer BPM
**Status:** ⬜ TODO

Ensure BPM consistency:
- Timeline uses its own BPM
- Patterns play at timeline BPM (time-stretched if needed)
- Or: patterns keep original BPM (simpler)

**Files:** `src/contexts/TimelineContext.tsx`

---

## Stretch Goals

### TIMELINE-019: Track Reordering
**Status:** ⬜ TODO

Allow dragging tracks to reorder.

---

### TIMELINE-020: Pinch to Zoom
**Status:** ⬜ TODO

Allow pinch gesture to zoom timeline (show more/fewer measures).

---

### TIMELINE-021: Pattern Preview in Block
**Status:** ⬜ TODO

Show mini waveform or step preview inside blocks.

---

## Progress Summary

| Phase | Total | Done | In Progress | TODO |
|-------|-------|------|-------------|------|
| Phase 1 | 7 | 7 | 0 | 0 |
| Phase 2 | 3 | 3 | 0 | 0 |
| Phase 3 | 3 | 3 | 0 | 0 |
| Phase 4 | 3 | 0 | 0 | 3 |
| Phase 5 | 2 | 0 | 0 | 2 |
| Stretch | 3 | 0 | 0 | 3 |
| **Total** | **21** | **13** | **0** | **8** |

---

## Implementation Notes

_Add notes here as implementation progresses..._
