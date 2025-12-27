import React from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import type { WaveformType, SynthSettings } from '@/audio/synth-engine'

const WAVEFORMS: { value: WaveformType; label: string }[] = [
  { value: 'sine', label: 'Sine' },
  { value: 'square', label: 'Square' },
  { value: 'sawtooth', label: 'Saw' },
  { value: 'triangle', label: 'Tri' },
]

const OCTAVES = [-2, -1, 0, 1, 2]

interface SynthConfigProps {
  settings: SynthSettings
  onWaveformChange: (waveform: WaveformType) => void
  onOctaveChange: (octave: number) => void
  onDetuneChange: (cents: number) => void
  onAttackChange: (seconds: number) => void
  onReleaseChange: (seconds: number) => void
  onFilterChange: (hz: number) => void
  className?: string
}

// Custom comparison function to handle object prop (settings)
function arePropsEqual(prevProps: SynthConfigProps, nextProps: SynthConfigProps): boolean {
  // Check className
  if (prevProps.className !== nextProps.className) {
    return false
  }

  // Deep compare settings object
  const prevSettings = prevProps.settings
  const nextSettings = nextProps.settings

  if (
    prevSettings.waveform !== nextSettings.waveform ||
    prevSettings.octave !== nextSettings.octave ||
    prevSettings.detune !== nextSettings.detune ||
    prevSettings.attack !== nextSettings.attack ||
    prevSettings.release !== nextSettings.release ||
    prevSettings.filterCutoff !== nextSettings.filterCutoff
  ) {
    return false
  }

  // Callbacks are assumed stable (wrapped in useCallback in parent)
  return true
}

export const SynthConfig = React.memo(function SynthConfig({
  settings,
  onWaveformChange,
  onOctaveChange,
  onDetuneChange,
  onAttackChange,
  onReleaseChange,
  onFilterChange,
  className,
}: SynthConfigProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Waveform selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground w-14">Wave</span>
        <div className="flex gap-1" role="group" aria-label="Waveform selector">
          {WAVEFORMS.map(({ value, label }) => (
            <Button
              key={value}
              variant={settings.waveform === value ? 'default' : 'outline'}
              size="sm"
              className="px-2 h-7 text-xs"
              onClick={() => onWaveformChange(value)}
              aria-label={`${label} waveform`}
              aria-pressed={settings.waveform === value}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Octave selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground w-14">Octave</span>
        <div className="flex gap-1" role="group" aria-label="Octave selector">
          {OCTAVES.map(oct => (
            <Button
              key={oct}
              variant={settings.octave === oct ? 'default' : 'outline'}
              size="sm"
              className="w-9 h-7 text-xs"
              onClick={() => onOctaveChange(oct)}
              aria-label={`Octave ${oct > 0 ? `+${oct}` : oct}`}
              aria-pressed={settings.octave === oct}
            >
              {oct > 0 ? `+${oct}` : oct}
            </Button>
          ))}
        </div>
      </div>

      {/* Detune slider */}
      <div className="flex items-center gap-3">
        <label htmlFor="detune-slider" className="text-sm text-muted-foreground w-14">Detune</label>
        <Slider
          value={[settings.detune]}
          min={-100}
          max={100}
          step={1}
          onValueChange={([v]) => onDetuneChange(v)}
          className="flex-1"
          aria-label="Detune in cents"
        />
        <span className="text-xs font-mono w-10 text-right" aria-live="polite">{settings.detune}c</span>
      </div>

      {/* Attack slider */}
      <div className="flex items-center gap-3">
        <label htmlFor="attack-slider" className="text-sm text-muted-foreground w-14">Attack</label>
        <Slider
          value={[settings.attack * 1000]}
          min={10}
          max={1000}
          step={10}
          onValueChange={([v]) => onAttackChange(v / 1000)}
          className="flex-1"
          aria-label="Attack time in milliseconds"
        />
        <span className="text-xs font-mono w-10 text-right" aria-live="polite">{Math.round(settings.attack * 1000)}ms</span>
      </div>

      {/* Release slider */}
      <div className="flex items-center gap-3">
        <label htmlFor="release-slider" className="text-sm text-muted-foreground w-14">Release</label>
        <Slider
          value={[settings.release * 1000]}
          min={50}
          max={2000}
          step={50}
          onValueChange={([v]) => onReleaseChange(v / 1000)}
          className="flex-1"
          aria-label="Release time in milliseconds"
        />
        <span className="text-xs font-mono w-10 text-right" aria-live="polite">{Math.round(settings.release * 1000)}ms</span>
      </div>

      {/* Filter cutoff slider */}
      <div className="flex items-center gap-3">
        <label htmlFor="filter-slider" className="text-sm text-muted-foreground w-14">Filter</label>
        <Slider
          value={[settings.filterCutoff]}
          min={200}
          max={8000}
          step={100}
          onValueChange={([v]) => onFilterChange(v)}
          className="flex-1"
          aria-label="Filter cutoff frequency in hertz"
        />
        <span className="text-xs font-mono w-10 text-right" aria-live="polite">{settings.filterCutoff >= 1000 ? `${(settings.filterCutoff / 1000).toFixed(1)}k` : settings.filterCutoff}</span>
      </div>
    </div>
  )
}, arePropsEqual)
