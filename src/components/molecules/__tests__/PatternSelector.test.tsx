import { render, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PatternSelector } from '../PatternSelector'
import type { SequencerPattern } from '@/types/audio.types'

describe('PatternSelector', () => {
  const mockPatterns: SequencerPattern[] = [
    {
      id: 'pattern1',
      name: 'Pattern 1',
      bpm: 120,
      steps: 16,
      sequences: [],
    },
    {
      id: 'pattern2',
      name: 'Pattern 2',
      bpm: 140,
      steps: 16,
      sequences: [],
    },
    {
      id: 'pattern3',
      name: 'Pattern 3',
      bpm: 100,
      steps: 16,
      sequences: [],
    },
  ]

  const defaultProps = {
    patterns: mockPatterns,
    currentPatternId: 'pattern1',
    onSelectPattern: vi.fn(),
  }

  it('should display current pattern name', () => {
    const { getByText } = render(<PatternSelector {...defaultProps} />)
    expect(getByText('Pattern 1')).toBeInTheDocument()
  })

  it('should display "Select Pattern" when no pattern is selected', () => {
    const { getByText } = render(
      <PatternSelector
        {...defaultProps}
        currentPatternId="non-existent"
      />
    )
    expect(getByText('Select Pattern')).toBeInTheDocument()
  })

  it('should open dropdown when trigger button is clicked', () => {
    const { getByText, queryByText } = render(<PatternSelector {...defaultProps} />)

    // Dropdown should be closed initially
    expect(queryByText('Pattern 2')).not.toBeInTheDocument()

    // Click to open
    fireEvent.click(getByText('Pattern 1'))

    // Dropdown should now be visible
    expect(getByText('Pattern 2')).toBeInTheDocument()
    expect(getByText('Pattern 3')).toBeInTheDocument()
  })

  it('should close dropdown when clicking the trigger button again', () => {
    const { getByRole, queryByText } = render(<PatternSelector {...defaultProps} />)

    // Open dropdown
    const triggerButton = getByRole('button', { name: /Pattern 1/i })
    fireEvent.click(triggerButton)
    expect(queryByText('Pattern 2')).toBeInTheDocument()

    // Close dropdown
    fireEvent.click(triggerButton)
    expect(queryByText('Pattern 2')).not.toBeInTheDocument()
  })

  it('should display all patterns in dropdown', () => {
    const { getByRole, getAllByText } = render(<PatternSelector {...defaultProps} />)

    // Open dropdown
    const triggerButton = getByRole('button', { name: /Pattern 1/i })
    fireEvent.click(triggerButton)

    // All patterns should be visible (some may appear multiple times)
    expect(getAllByText('Pattern 1').length).toBeGreaterThan(0)
    expect(getAllByText('Pattern 2').length).toBeGreaterThan(0)
    expect(getAllByText('Pattern 3').length).toBeGreaterThan(0)
  })

  it('should display BPM for each pattern', () => {
    const { getByText } = render(<PatternSelector {...defaultProps} />)

    // Open dropdown
    fireEvent.click(getByText('Pattern 1'))

    // BPM should be displayed
    expect(getByText('120 BPM')).toBeInTheDocument()
    expect(getByText('140 BPM')).toBeInTheDocument()
    expect(getByText('100 BPM')).toBeInTheDocument()
  })

  it('should show check mark on current pattern', () => {
    const { container, getByText } = render(<PatternSelector {...defaultProps} />)

    // Open dropdown
    fireEvent.click(getByText('Pattern 1'))

    // Check mark should be present (lucide Check icon)
    const checkIcons = container.querySelectorAll('svg')
    // There should be at least one check icon (plus the chevron)
    expect(checkIcons.length).toBeGreaterThan(1)
  })

  it('should call onSelectPattern when a pattern is clicked', () => {
    const onSelectPattern = vi.fn()
    const { getByText } = render(
      <PatternSelector {...defaultProps} onSelectPattern={onSelectPattern} />
    )

    // Open dropdown
    fireEvent.click(getByText('Pattern 1'))

    // Click a different pattern
    const pattern2Elements = getByText('Pattern 2')
    fireEvent.click(pattern2Elements)

    expect(onSelectPattern).toHaveBeenCalledWith('pattern2')
    expect(onSelectPattern).toHaveBeenCalledTimes(1)
  })

  it('should close dropdown after selecting a pattern', () => {
    const { getByText, queryByText } = render(<PatternSelector {...defaultProps} />)

    // Open dropdown
    fireEvent.click(getByText('Pattern 1'))
    expect(getByText('100 BPM')).toBeInTheDocument()

    // Click a pattern
    fireEvent.click(getByText('Pattern 2'))

    // Dropdown should be closed
    expect(queryByText('100 BPM')).not.toBeInTheDocument()
  })

  it('should close dropdown when clicking outside', () => {
    const { getByText, queryByText, container } = render(
      <div>
        <div data-testid="outside">Outside element</div>
        <PatternSelector {...defaultProps} />
      </div>
    )

    // Open dropdown
    fireEvent.click(getByText('Pattern 1'))
    expect(getByText('Pattern 2')).toBeInTheDocument()

    // Click outside
    const outside = container.querySelector('[data-testid="outside"]')
    fireEvent.mouseDown(outside!)

    // Dropdown should be closed
    expect(queryByText('Pattern 2')).not.toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <PatternSelector {...defaultProps} className="custom-class" />
    )
    const wrapper = container.querySelector('.custom-class')
    expect(wrapper).toBeInTheDocument()
  })

  it('should rotate chevron icon when dropdown is open', () => {
    const { container, getByText } = render(<PatternSelector {...defaultProps} />)

    // Get chevron icon
    const chevron = container.querySelector('svg')

    // Initially not rotated
    expect(chevron).not.toHaveClass('rotate-180')

    // Open dropdown
    fireEvent.click(getByText('Pattern 1'))

    // Should be rotated
    expect(chevron).toHaveClass('rotate-180')
  })

  it('should highlight current pattern in dropdown', () => {
    const { container, getByText } = render(
      <PatternSelector {...defaultProps} currentPatternId="pattern2" />
    )

    // Open dropdown
    fireEvent.click(getByText('Pattern 2'))

    // Pattern 2 button should have accent background
    const buttons = container.querySelectorAll('button')
    const pattern2Button = Array.from(buttons).find(btn =>
      btn.textContent?.includes('Pattern 2') && btn.textContent?.includes('140 BPM')
    )

    expect(pattern2Button).toHaveClass('bg-accent/50')
  })
})
