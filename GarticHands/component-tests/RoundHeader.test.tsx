/**
 * RoundHeader.test.tsx
 *
 * Component tests for RoundHeader (client/src/components/ui/RoundHeader).
 *
 * RoundHeader is a simple presentational component that renders a
 * "Round X of Y" label, used on the input, draw, and guess pages. There is
 * no internal state or branching logic, so these tests focus on confirming
 * the round and totalRounds values are interpolated correctly into the
 * displayed text.
 */

import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import RoundHeader from '../client/src/components/ui/RoundHeader'

describe('RoundHeader', () => {
  test('renders the round and total rounds values', () => {
    render(<RoundHeader round={2} totalRounds={4} />)

    expect(screen.getByText('Round 2 of 4')).toBeInTheDocument()
  })

  test('renders correctly for the first round', () => {
    render(<RoundHeader round={1} totalRounds={4} />)

    expect(screen.getByText('Round 1 of 4')).toBeInTheDocument()
  })

  test('renders correctly for the final round', () => {
    render(<RoundHeader round={4} totalRounds={4} />)

    expect(screen.getByText('Round 4 of 4')).toBeInTheDocument()
  })

  test('renders correctly when totalRounds is 1', () => {
    render(<RoundHeader round={1} totalRounds={1} />)

    expect(screen.getByText('Round 1 of 1')).toBeInTheDocument()
  })
})