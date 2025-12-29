import { render, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PlayButton } from '../PlayButton'

describe('PlayButton', () => {
  it('should render Play icon when not playing', () => {
    const { container } = render(
      <PlayButton isPlaying={false} onToggle={vi.fn()} />
    )
    const icon = container.querySelector('svg.lucide-play')
    expect(icon).toBeInTheDocument()
  })

  it('should render Pause icon when playing', () => {
    const { container } = render(
      <PlayButton isPlaying={true} onToggle={vi.fn()} />
    )
    const icon = container.querySelector('svg.lucide-pause')
    expect(icon).toBeInTheDocument()
  })

  it('should have "Start playback" aria-label when not playing', () => {
    const { getByRole } = render(
      <PlayButton isPlaying={false} onToggle={vi.fn()} />
    )
    const button = getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Start playback')
  })

  it('should have "Pause playback" aria-label when playing', () => {
    const { getByRole } = render(
      <PlayButton isPlaying={true} onToggle={vi.fn()} />
    )
    const button = getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Pause playback')
  })

  it('should call onToggle when clicked', () => {
    const onToggle = vi.fn()
    const { getByRole } = render(
      <PlayButton isPlaying={false} onToggle={onToggle} />
    )
    fireEvent.click(getByRole('button'))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('should call onToggle when clicked while playing', () => {
    const onToggle = vi.fn()
    const { getByRole } = render(
      <PlayButton isPlaying={true} onToggle={onToggle} />
    )
    fireEvent.click(getByRole('button'))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('should apply custom className', () => {
    const { getByRole } = render(
      <PlayButton isPlaying={false} onToggle={vi.fn()} className="custom-class" />
    )
    const button = getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('should have default variant when not playing', () => {
    const { container } = render(
      <PlayButton isPlaying={false} onToggle={vi.fn()} />
    )
    // Button component with default variant should not have destructive class
    const button = container.querySelector('button')
    expect(button).not.toHaveClass('destructive')
  })

  it('should display Play icon when not playing', () => {
    const { container } = render(
      <PlayButton isPlaying={false} onToggle={vi.fn()} />
    )
    // lucide-react icons have the lucide class
    const icon = container.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('should display Pause icon when playing', () => {
    const { container } = render(
      <PlayButton isPlaying={true} onToggle={vi.fn()} />
    )
    const icon = container.querySelector('svg.lucide-pause')
    expect(icon).toBeInTheDocument()
  })
})
