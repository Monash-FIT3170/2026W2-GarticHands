/**
 * Card.test.tsx
 *
 * Component tests for `<Card />` (client/src/components/ui/Card).
 *
 * `Card` is a generic surface/container with three visual variants:
 *  - 'lobby': large card used on the hosting page.
 *  - 'hero':  rounded card used on the landing page.
 *  - 'glass': translucent card used on input/draw/guess pages (default).
 *
 * It renders whatever `children` it's given inside a div styled per the
 * chosen variant, and supports an extra `className` for one-off tweaks.
 */

import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Card from '../client/src/components/ui/Card'

describe('Card', () => {
  test('renders its children', () => {
    render(
      <Card>
        <p>Card content</p>
      </Card>,
    )

    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  test('defaults to the glass variant when no variant is given', () => {
    const { container } = render(<Card>Default</Card>)

    expect(container.firstChild).toHaveClass(
      'bg-[var(--surface-soft)]',
      'rounded-2xl',
    )
  })

  test('applies the lobby variant classes', () => {
    const { container } = render(<Card variant="lobby">Lobby</Card>)

    expect(container.firstChild).toHaveClass(
      'bg-[var(--card-bg)]',
      'rounded-xl',
      'border-[var(--card-border)]',
    )
  })

  test('applies the hero variant classes', () => {
    const { container } = render(<Card variant="hero">Hero</Card>)

    expect(container.firstChild).toHaveClass(
      'bg-[var(--hero-bg)]',
      'rounded-3xl',
      'items-center',
    )
  })

  test('applies the glass variant classes explicitly', () => {
    const { container } = render(<Card variant="glass">Glass</Card>)

    expect(container.firstChild).toHaveClass(
      'bg-[var(--surface-soft)]',
      'border-[var(--surface-border)]',
    )
  })

  test('merges an extra className onto the computed variant classes', () => {
    const { container } = render(
      <Card variant="lobby" className="mt-6">
        Spaced
      </Card>,
    )

    expect(container.firstChild).toHaveClass('mt-6')

    // Variant classes should still be present alongside the custom one.
    expect(container.firstChild).toHaveClass('bg-[var(--card-bg)]')
  })
})