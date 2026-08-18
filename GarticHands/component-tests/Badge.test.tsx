/**
 * Badge.test.tsx
 *
 * Component tests for `<Badge />` (client/src/components/ui/Badge).
 *
 * `Badge` renders a small status pill next to a player's name, and has two
 * independent axes of variation:
 *  - `tone`: 'lobby' (colourful, per-kind background colours used on the
 *            hosting page) vs 'simple' (a single flat style used on the
 *            joined page). Defaults to 'simple'.
 *  - `kind`: 'host' | 'ready' | 'waiting' determines the label text, and
 *            (for 'lobby' tone) the background/text colour.
 *
 * Both the rendered label text and the applied classes are asserted here,
 * since the whole point of this component is picking the right combination
 * of the two based on props.
 */

import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Badge from '../client/src/components/ui/Badge'

describe('Badge', () => {
  test('defaults to the simple tone when no tone is given', () => {
    render(<Badge kind="ready" />)

    // Simple tone uses a flat class shared across all kinds, no
    // kind-specific background colour.
    expect(screen.getByText('Ready')).toHaveClass(
      'text-xs',
      'font-bold',
      'px-3',
      'py-0.5',
      'rounded-full',
    )
  })

  test('simple tone renders the correct label for each kind', () => {
    const { rerender } = render(<Badge tone="simple" kind="host" />)
    expect(screen.getByText('Host')).toBeInTheDocument()

    rerender(<Badge tone="simple" kind="ready" />)
    expect(screen.getByText('Ready')).toBeInTheDocument()

    rerender(<Badge tone="simple" kind="waiting" />)
    expect(screen.getByText('Waiting')).toBeInTheDocument()
  })

  test('lobby tone renders the host label with the host colour classes', () => {
    render(<Badge tone="lobby" kind="host" />)

    const badge = screen.getByText('Host')
    expect(badge).toHaveClass('bg-yellow-200', 'text-[#D4623E]')
  })

  test('lobby tone renders the ready label with the ready colour classes', () => {
    render(<Badge tone="lobby" kind="ready" />)

    const badge = screen.getByText('Ready')
    expect(badge).toHaveClass('bg-green-200', 'text-[#2E5534]')
  })

  test('lobby tone renders the waiting label with the waiting colour classes', () => {
    render(<Badge tone="lobby" kind="waiting" />)

    const badge = screen.getByText('Waiting')
    expect(badge).toHaveClass('bg-orange-100', 'text-[#D4623E]')
  })
})