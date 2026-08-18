import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import PersonIcon from '../client/src/components/ui/icons/PersonIcon'

describe('PersonIcon', () => {
  /**
   * Verifies that the component renders an SVG element.
   */
  it('renders the person icon as an SVG', () => {
    const { container } = render(<PersonIcon />)

    const svg = container.querySelector('svg')

    expect(svg).toBeInTheDocument()
  })

  /**
   * Verifies that the default className is applied when no className is provided.
   */
  it('applies the default className', () => {
    const { container } = render(<PersonIcon />)

    const svg = container.querySelector('svg')

    expect(svg).toHaveClass('w-5', 'h-5')
  })

  /**
   * Verifies that a custom className replaces the default className.
   */
  it('applies a custom className', () => {
    const { container } = render(<PersonIcon className="custom-icon" />)

    const svg = container.querySelector('svg')

    expect(svg).toHaveClass('custom-icon')
    expect(svg).not.toHaveClass('w-5', 'h-5')
  })

  /**
   * Verifies that the SVG contains the expected person silhouette elements.
   */
  it('renders the expected person icon elements', () => {
    const { container } = render(<PersonIcon />)

    const circle = container.querySelector('circle')
    const path = container.querySelector('path')

    expect(circle).toBeInTheDocument()
    expect(circle).toHaveAttribute('cx', '12')
    expect(circle).toHaveAttribute('cy', '8')
    expect(circle).toHaveAttribute('r', '4')

    expect(path).toBeInTheDocument()
    expect(path).toHaveAttribute('d', 'M4 20c0-4 3.6-7 8-7s8 3 8 7')
  })

  /**
   * Verifies that the SVG uses the expected viewBox.
   */
  it('uses the expected SVG viewBox', () => {
    const { container } = render(<PersonIcon />)

    const svg = container.querySelector('svg')

    expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
  })
})