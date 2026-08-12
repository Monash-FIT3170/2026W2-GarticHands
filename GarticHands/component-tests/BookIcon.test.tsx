import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import BookIcon from '../client/src/components/ui/icons/BookIcon'

describe('BookIcon', () => {
  /**
   * Verifies that the component renders an SVG element.
   */
  it('renders the book icon as an SVG', () => {
    const { container } = render(<BookIcon />)

    const svg = container.querySelector('svg')

    expect(svg).toBeInTheDocument()
  })

  /**
   * Verifies that the default className is applied when no className is provided.
   */
  it('applies the default className', () => {
    const { container } = render(<BookIcon />)

    const svg = container.querySelector('svg')

    expect(svg).toHaveClass('w-7', 'h-7')
  })

  /**
   * Verifies that a custom className overrides the default className.
   */
  it('applies a custom className', () => {
    const { container } = render(<BookIcon className="custom-icon" />)

    const svg = container.querySelector('svg')

    expect(svg).toHaveClass('custom-icon')
    expect(svg).not.toHaveClass('w-7', 'h-7')
  })

  /**
   * Verifies that the SVG contains the expected book icon paths.
   */
  it('renders the expected book icon paths', () => {
    const { container } = render(<BookIcon />)

    const paths = container.querySelectorAll('path')

    expect(paths).toHaveLength(2)

    expect(paths[0]).toHaveAttribute(
      'd',
      'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z',
    )

    expect(paths[1]).toHaveAttribute(
      'd',
      'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
    )
  })

  /**
   * Verifies that the SVG has the expected viewBox used by the icon.
   */
  it('uses the expected SVG viewBox', () => {
    const { container } = render(<BookIcon />)

    const svg = container.querySelector('svg')

    expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
  })
})