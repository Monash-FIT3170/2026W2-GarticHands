import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import GearIcon from '../client/src/components/ui/icons/GearIcon'

describe('GearIcon', () => {
  /**
   * Verifies that the component renders an SVG element.
   */
  it('renders the gear icon as an SVG', () => {
    const { container } = render(<GearIcon />)

    const svg = container.querySelector('svg')

    expect(svg).toBeInTheDocument()
  })

  /**
   * Verifies that the default className is applied when no className is provided.
   */
  it('applies the default className', () => {
    const { container } = render(<GearIcon />)

    const svg = container.querySelector('svg')

    expect(svg).toHaveClass('w-7', 'h-7')
  })

  /**
   * Verifies that a custom className replaces the default className.
   */
  it('applies a custom className', () => {
    const { container } = render(<GearIcon className="custom-icon" />)

    const svg = container.querySelector('svg')

    expect(svg).toHaveClass('custom-icon')
    expect(svg).not.toHaveClass('w-7', 'h-7')
  })

  /**
   * Verifies that the SVG contains the expected circle and gear path.
   */
  it('renders the expected gear icon elements', () => {
    const { container } = render(<GearIcon />)

    const circle = container.querySelector('circle')
    const path = container.querySelector('path')

    expect(circle).toBeInTheDocument()
    expect(circle).toHaveAttribute('cx', '12')
    expect(circle).toHaveAttribute('cy', '12')
    expect(circle).toHaveAttribute('r', '3')

    expect(path).toBeInTheDocument()
    expect(path).toHaveAttribute(
      'd',
      'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
    )
  })

  /**
   * Verifies that the SVG uses the expected viewBox.
   */
  it('uses the expected SVG viewBox', () => {
    const { container } = render(<GearIcon />)

    const svg = container.querySelector('svg')

    expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
  })
})