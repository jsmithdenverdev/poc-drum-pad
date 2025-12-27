import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SequencerPattern } from '@/types/audio.types'

interface PatternSelectorProps {
  patterns: SequencerPattern[]
  currentPatternId: string
  onSelectPattern: (patternId: string) => void
  className?: string
}

export function PatternSelector({
  patterns,
  currentPatternId,
  onSelectPattern,
  className,
}: PatternSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentPattern = patterns.find(p => p.id === currentPatternId)
  const displayName = currentPattern?.name || 'Select Pattern'

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (patternId: string) => {
    onSelectPattern(patternId)
    setIsOpen(false)
  }

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Trigger button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
      >
        <span className="text-sm truncate">{displayName}</span>
        <ChevronDown className={cn('w-4 h-4 ml-2 transition-transform', isOpen && 'rotate-180')} />
      </Button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover text-popover-foreground border border-border rounded-md shadow-lg z-50 overflow-hidden max-h-64 overflow-y-auto">
          <div className="py-1">
            {patterns.map((pattern) => (
              <button
                key={pattern.id}
                onClick={() => handleSelect(pattern.id)}
                className={cn(
                  'w-full px-3 py-2 text-sm text-left hover:bg-secondary transition-colors flex items-center justify-between',
                  pattern.id === currentPatternId && 'bg-secondary'
                )}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{pattern.name}</span>
                  <span className="text-xs text-muted-foreground">{pattern.bpm} BPM</span>
                </div>
                {pattern.id === currentPatternId && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
