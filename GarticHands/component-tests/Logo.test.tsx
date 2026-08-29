/**
 * Logo.test.tsx
 *
 * Component tests for `<Logo />` (client/src/components/ui/Logo).
 *
 * `Logo` renders the wordmark image + subtitle image pair shown at the top
 * of landing and lobby pages. The only behavioural branch is `compact`:
 * when true, the pair is wrapped in an extra div that applies a
 * shrink/margin adjustment used specifically on lobby pages.
 */

import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Logo from '../client/src/components/ui/Logo'

describe('Logo', () => {
  test('renders the wordmark and subtitle images', () => {
    render(<Logo />)

    expect(screen.getByAltText('GarticHand logo')).toBeInTheDocument()
    expect(screen.getByAltText('The Telephone Hand Game')).toBeInTheDocument()
  })

  test('wordmark image points at the correct source', () => {
    render(<Logo />)

    expect(screen.getByAltText('GarticHand logo')).toHaveAttribute('src', '/logo.png')
  })

  test('subtitle image points at the correct source', () => {
    render(<Logo />)

    expect(screen.getByAltText('The Telephone Hand Game')).toHaveAttribute(
      'src',
      '/subtitle.png',
    )
  })

  test('does not apply the compact wrapper by default', () => {
    const { container } = render(<Logo />)

    // Without compact, the outer element should be the inner flex column
    // itself, not wrapped in an extra scale/margin div.
    expect(container.firstChild).toHaveClass('flex', 'flex-col', 'items-center')
    expect(container.firstChild).not.toHaveClass('scale-90')
  })

  test('applies the compact wrapper when compact is true', () => {
    const { container } = render(<Logo compact />)

    // With compact, an extra wrapping div with the shrink/margin classes
    // should be the outermost element.
    expect(container.firstChild).toHaveClass('scale-90', '-mb-4')
  })

  test('still renders both images when compact', () => {
    render(<Logo compact />)

    expect(screen.getByAltText('GarticHand logo')).toBeInTheDocument()
    expect(screen.getByAltText('The Telephone Hand Game')).toBeInTheDocument()
  })
})