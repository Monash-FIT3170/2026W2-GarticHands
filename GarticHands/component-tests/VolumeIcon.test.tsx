import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import VolumeIcon from '../client/src/components/ui/icons/VolumeIcon'

describe('VolumeIcon', () => {
  /**
   * Verifies that the component renders an SVG element.
   */
  it('renders the volume icon as an SVG', () => {
    const { container } = render(<VolumeIcon />)

    const svg = container.querySelector('svg')

    expect(svg).toBeInTheDocument()
  })

  /**
   * Verifies that the default className is applied when no className is provided.
   */
  it('applies the default className', () => {
    const { container } = render(<VolumeIcon />)

    const svg = container.querySelector('svg')

    expect(svg).toHaveClass('w-7', 'h-7')
  })

  /**
   * Verifies that a custom className replaces the default className.
   */
  it('applies a custom className', () => {
    const { container } = render(<VolumeIcon className="custom-icon" />)

    const svg = container.querySelector('svg')

    expect(svg).toHaveClass('custom-icon')
    expect(svg).not.toHaveClass('w-7', 'h-7')
  })

  /**
   * Verifies that the SVG contains the expected volume icon elements.
   */
  it('renders the expected volume icon elements', () => {
    const { container } = render(<VolumeIcon />)

    const polygon = container.querySelector('polygon')
    const paths = container.querySelectorAll('path')

    expect(polygon).toBeInTheDocument()
    expect(polygon).toHaveAttribute(
      'points',
      '11 5 6 9 2 9 2 15 6 15 11 19 11 5',
    )

    expect(paths).toHaveLength(2)

    expect(paths[0]).toHaveAttribute(
      'd',
      'M15.54 8.46a5 5 0 0 1 0 7.07',
    )

    expect(paths[1]).toHaveAttribute(
      'd',
      'M19.07 4.93a10 10 0 0 1 0 14.14',
    )
  })

  /**
   * Verifies that the SVG uses the expected viewBox.
   */
  it('uses the expected SVG viewBox', () => {
    const { container } = render(<VolumeIcon />)

    const svg = container.querySelector('svg')

    expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
  })
})