import { render, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { StepButton } from '../StepButton'

describe('StepButton', () => {
  const defaultProps = {
    stepIndex: 0,
    isSelected: false,
    isCurrentStep: false,
    activeSoundColors: [],
    onSelect: vi.fn(),
  }

  it('should call onSelect when clicked', () => {
    const onSelect = vi.fn()
    const { getByRole } = render(
      <StepButton {...defaultProps} onSelect={onSelect} />
    )
    fireEvent.click(getByRole('button'))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('should have correct aria-label for basic step', () => {
    const { getByRole } = render(<StepButton {...defaultProps} stepIndex={0} />)
    const button = getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Step 1')
  })

  it('should include "selected" in aria-label when selected', () => {
    const { getByRole } = render(
      <StepButton {...defaultProps} stepIndex={2} isSelected={true} />
    )
    const button = getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Step 3, selected')
  })

  it('should include sound count in aria-label when sounds are active', () => {
    const { getByRole } = render(
      <StepButton
        {...defaultProps}
        stepIndex={0}
        activeSoundColors={['#ff0000', '#00ff00']}
      />
    )
    const button = getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Step 1, 2 sounds')
  })

  it('should set aria-pressed to true when selected', () => {
    const { getByRole } = render(
      <StepButton {...defaultProps} isSelected={true} />
    )
    const button = getByRole('button')
    expect(button).toHaveAttribute('aria-pressed', 'true')
  })

  it('should set aria-pressed to false when not selected', () => {
    const { getByRole } = render(
      <StepButton {...defaultProps} isSelected={false} />
    )
    const button = getByRole('button')
    expect(button).toHaveAttribute('aria-pressed', 'false')
  })

  it('should render sound indicators when activeSoundColors are provided', () => {
    const { container } = render(
      <StepButton
        {...defaultProps}
        activeSoundColors={['#ff0000', '#00ff00', '#0000ff']}
      />
    )
    const indicators = container.querySelectorAll('.w-1\\.5')
    expect(indicators).toHaveLength(3)
  })

  it('should limit sound indicators to maximum of 4', () => {
    const { container } = render(
      <StepButton
        {...defaultProps}
        activeSoundColors={['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff']}
      />
    )
    const indicators = container.querySelectorAll('.w-1\\.5')
    expect(indicators).toHaveLength(4)
  })

  it('should not render sound indicators when no sounds are active', () => {
    const { container } = render(
      <StepButton {...defaultProps} activeSoundColors={[]} />
    )
    const indicators = container.querySelectorAll('.w-1\\.5')
    expect(indicators).toHaveLength(0)
  })

  it('should show playhead glow when isCurrentStep is true', () => {
    const { container } = render(
      <StepButton {...defaultProps} isCurrentStep={true} />
    )
    const glowElement = container.querySelector('.animate-pulse')
    expect(glowElement).toBeInTheDocument()
  })

  it('should not show playhead glow when isCurrentStep is false', () => {
    const { container } = render(
      <StepButton {...defaultProps} isCurrentStep={false} />
    )
    const glowElement = container.querySelector('.animate-pulse')
    expect(glowElement).not.toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { getByRole } = render(
      <StepButton {...defaultProps} className="custom-class" />
    )
    const button = getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('should have special styling for beat start (divisible by 4)', () => {
    const { getByRole } = render(<StepButton {...defaultProps} stepIndex={4} />)
    const button = getByRole('button')
    expect(button).toHaveClass('ring-1', 'ring-muted-foreground/20')
  })

  it('should not have beat start styling for non-beat-start steps', () => {
    const { getByRole } = render(<StepButton {...defaultProps} stepIndex={3} />)
    const button = getByRole('button')
    expect(button).not.toHaveClass('ring-1')
  })
})
