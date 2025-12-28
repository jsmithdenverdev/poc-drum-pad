import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Save, X } from 'lucide-react'

interface SavePatternModalProps {
  open: boolean
  onClose: () => void
  onSave: (name: string) => void
  defaultName?: string
}

export function SavePatternModal({
  open,
  onClose,
  onSave,
  defaultName = '',
}: SavePatternModalProps) {
  const [name, setName] = useState(defaultName)
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle open state changes
  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (isOpen) {
      // Reset name when opening
      setName(defaultName)
    } else {
      onClose()
    }
  }, [defaultName, onClose])

  // Focus input after sheet animation
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100)
      return () => clearTimeout(timer)
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (trimmedName) {
      onSave(trimmedName)
      onClose()
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="max-h-[50vh] flex flex-col rounded-t-xl">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-lg">Save Pattern</SheetTitle>
          <SheetDescription className="text-sm">
            Give your pattern a name to find it later
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Pattern name..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary"
            autoComplete="off"
          />

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!name.trim()}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
