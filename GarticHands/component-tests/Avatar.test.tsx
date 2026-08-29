/**
 * Avatar.test.tsx
 *
 * Component tests for `<Avatar />` (client/src/components/ui/Avatar).
 *
 * `Avatar` renders one of five visual variants used across different screens:
 *  - 'guest':      large white circle with a person icon (landing page).
 *  - 'host-large':  header avatar showing the host's initial letter (or "H"
 *                    as a fallback) instead of the person icon.
 *  - 'host-row':    small avatar in the player list for the host.
 *  - 'player-row':  small avatar in the player list for a regular player.
 *  - 'empty-row':   small avatar for an empty/unfilled player slot.
 *
 * The real `PersonIcon` is mocked out here so tests can assert on exactly
 * what size class it was given, without depending on its internal SVG markup.
 */

import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import Avatar from '../client/src/components/ui/Avatar'

// Spy used to inspect what props the real PersonIcon receives.
const mockPersonIcon = vi.fn((_props: { className?: string }) => (
  <svg data-testid="person-icon" />
))

// Replace the real PersonIcon with a stub that forwards its props to the spy
// above and renders a simple placeholder SVG.
vi.mock('../client/src/components/ui/icons/PersonIcon', () => ({
  default: (props: { className?: string }) => {
    mockPersonIcon(props)
    return <svg data-testid="person-icon" />
  },
}))

describe('Avatar', () => {
  // Reset mock call history before each test so assertions aren't polluted
  // by calls from a previous test.
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('defaults to the guest variant when no variant is given', () => {
    const { container } = render(<Avatar />)

    // Guest shell: white circle, larger 24-unit size, no border classes.
    expect(container.firstChild).toHaveClass('bg-white', 'rounded-full', 'w-24', 'h-24')
  })

  test('renders the person icon at the larger guest size', () => {
    render(<Avatar variant="guest" />)

    // Guest is the only variant that renders the icon at the bigger 14-unit
    // size, with the orange accent colour.
    expect(mockPersonIcon).toHaveBeenCalledWith(
      expect.objectContaining({ className: 'w-14 h-14 text-[#D4623E]' }),
    )
  })

  test('renders the person icon at the smaller default size for non-guest, non-host-large variants', () => {
    render(<Avatar variant="host-row" />)

    // Every variant other than 'guest' and 'host-large' uses the compact
    // 5-unit icon size with no explicit colour override.
    expect(mockPersonIcon).toHaveBeenCalledWith(
      expect.objectContaining({ className: 'w-5 h-5' }),
    )
  })

  test('host-large variant renders the uppercased letter instead of the icon', () => {
    const { getByText } = render(<Avatar variant="host-large" letter="a" />)

    // Lowercase input should be uppercased for display.
    expect(getByText('A')).toBeInTheDocument()
    // host-large never renders PersonIcon, it shows a letter instead.
    expect(mockPersonIcon).not.toHaveBeenCalled()
  })

  test('host-large variant defaults to "H" when no letter is supplied', () => {
    const { getByText } = render(<Avatar variant="host-large" />)

    // Fallback initial when no `letter` prop is passed.
    expect(getByText('H')).toBeInTheDocument()
  })

  test('applies the host-row shell classes', () => {
    const { container } = render(<Avatar variant="host-row" />)

    // Orange border + solid white background distinguishes the host row
    // avatar from the player-row (transparent bg) and empty-row (teal) ones.
    expect(container.firstChild).toHaveClass(
      'border-[#D4623E]',
      'text-[#D4623E]',
      'bg-white',
    )
  })

  test('applies the player-row shell classes', () => {
    const { container } = render(<Avatar variant="player-row" />)

    // Same orange border/text as host-row, but transparent background.
    expect(container.firstChild).toHaveClass(
      'border-[#D4623E]',
      'text-[#D4623E]',
      'bg-transparent',
    )
  })

  test('applies the empty-row shell classes', () => {
    const { container } = render(<Avatar variant="empty-row" />)

    // Teal border/text/background distinguishes an unfilled lobby slot from
    // an occupied one (which uses orange).
    expect(container.firstChild).toHaveClass(
      'border-[#3D6B64]',
      'text-[#3D6B64]',
      'bg-[#8EBAB3]',
    )
  })
})