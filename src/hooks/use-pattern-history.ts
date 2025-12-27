import { useState, useCallback } from 'react'
import type { SequencerPattern } from '@/types/audio.types'

interface PatternHistory {
  past: SequencerPattern[]
  present: SequencerPattern
  future: SequencerPattern[]
}

const MAX_HISTORY = 50

export function usePatternHistory(initialPattern: SequencerPattern) {
  const [history, setHistory] = useState<PatternHistory>({
    past: [],
    present: initialPattern,
    future: [],
  })

  const setPattern = useCallback((patternOrUpdater: SequencerPattern | ((prev: SequencerPattern) => SequencerPattern)) => {
    setHistory(h => {
      const newPattern = typeof patternOrUpdater === 'function'
        ? patternOrUpdater(h.present)
        : patternOrUpdater
      return {
        past: [...h.past, h.present].slice(-MAX_HISTORY),
        present: newPattern,
        future: [],
      }
    })
  }, [])

  const undo = useCallback(() => {
    setHistory(h => {
      if (h.past.length === 0) return h
      const previous = h.past[h.past.length - 1]
      return {
        past: h.past.slice(0, -1),
        present: previous,
        future: [h.present, ...h.future],
      }
    })
  }, [])

  const redo = useCallback(() => {
    setHistory(h => {
      if (h.future.length === 0) return h
      const next = h.future[0]
      return {
        past: [...h.past, h.present],
        present: next,
        future: h.future.slice(1),
      }
    })
  }, [])

  const canUndo = history.past.length > 0
  const canRedo = history.future.length > 0

  return {
    pattern: history.present,
    setPattern,
    undo,
    redo,
    canUndo,
    canRedo
  }
}
