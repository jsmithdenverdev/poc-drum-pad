import { render, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DrumPad } from '../DrumPad'

describe('DrumPad', () => {
  const defaultProps = {
    id: 'kick',
    name: 'Kick',
    color: '#ff0000',
    onTrigger: vi.fn(),
  }

  it('should render with correct name', () => {
    const { getByText } = render(<DrumPad {...defaultProps} />)
    expect(getByText('Kick')).toBeInTheDocument()
  })

  it('should have correct aria-label', () => {
    const { getByRole } = render(<DrumPad {...defaultProps} />)
    const button = getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Kick drum pad')
  })

  it('should call onTrigger with id on pointer down', () => {
    const onTrigger = vi.fn()
    const { getByRole } = render(
      <DrumPad {...defaultProps} onTrigger={onTrigger} />
    )
    fireEvent.pointerDown(getByRole('button'))
    expect(onTrigger).toHaveBeenCalledWith('kick')
    expect(onTrigger).toHaveBeenCalledTimes(1)
  })

  it('should apply custom color as background', () => {
    const { getByRole } = render(<DrumPad {...defaultProps} color="#00ff00" />)
    const button = getByRole('button')
    expect(button).toHaveStyle({ backgroundColor: '#00ff00' })
  })

  it('should set aria-pressed to true when animating', () => {
    const { getByRole } = render(<DrumPad {...defaultProps} />)
    const button = getByRole('button')

    // Initially not pressed
    expect(button).toHaveAttribute('aria-pressed', 'false')

    // Trigger animation
    fireEvent.pointerDown(button)

    // Should be pressed during animation
    expect(button).toHaveAttribute('aria-pressed', 'true')
  })

  it('should reset animation state on animationEnd', () => {
    const { getByRole } = render(<DrumPad {...defaultProps} />)
    const button = getByRole('button')

    // Trigger animation
    fireEvent.pointerDown(button)
    expect(button).toHaveAttribute('aria-pressed', 'true')

    // End animation
    fireEvent.animationEnd(button)
    expect(button).toHaveAttribute('aria-pressed', 'false')
  })

  it('should apply custom className', () => {
    const { getByRole } = render(
      <DrumPad {...defaultProps} className="custom-class" />
    )
    const button = getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('should apply glow effect when animating', () => {
    const { getByRole } = render(<DrumPad {...defaultProps} color="#ff0000" />)
    const button = getByRole('button')

    // Trigger animation
    fireEvent.pointerDown(button)

    // Should have glow effect
    expect(button).toHaveStyle({ boxShadow: '0 0 20px #ff0000' })
  })
})
