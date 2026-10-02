/**
 * Avatar.test.tsx
 *
 * Component tests for `<Avatar />` (client/src/components/ui/Avatar).
 *
 * `Avatar` renders one of five visual variants used across different screens:
 *  - 'guest':      large surface-coloured circle with a person icon.
 *  - 'host-large': header avatar showing the host's initial letter (or "H"
 *                    as a fallback) instead of the person icon.
 *  - 'host-row':   small avatar in the player list for the host.
 *  - 'player-row': small avatar in the player list for a regular player.
 *  - 'empty-row':  small avatar for an empty/unfilled player slot.
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

    // Guest shell: surface colour, larger 24-unit size, no border classes.
    expect(container.firstChild).toHaveClass(
      'bg-[var(--surface)]',
      'rounded-full',
      'w-24',
      'h-24',
    )
  })

  test('renders the person icon at the larger guest size', () => {
    render(<Avatar variant="guest" />)

    // Guest uses the action colour for its larger person icon.
    expect(mockPersonIcon).toHaveBeenCalledWith(
      expect.objectContaining({
        className: 'w-14 h-14 text-[var(--action)]',
      }),
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

    // Host row uses the action colour for its border and text with a
    // surface-coloured background.
    expect(container.firstChild).toHaveClass(
      'border-[var(--action)]',
      'text-[var(--action)]',
      'bg-[var(--surface)]',
    )
  })

  test('applies the player-row shell classes', () => {
    const { container } = render(<Avatar variant="player-row" />)

    // Player row uses the action colour for its border and text with a
    // transparent background.
    expect(container.firstChild).toHaveClass(
      'border-[var(--action)]',
      'text-[var(--action)]',
      'bg-transparent',
    )
  })

  test('applies the empty-row shell classes', () => {
    const { container } = render(<Avatar variant="empty-row" />)

    // Empty row uses the primary text colour for its border and text,
    // together with the dedicated empty-avatar background.
    expect(container.firstChild).toHaveClass(
      'border-[var(--text-primary)]',
      'text-[var(--text-primary)]',
      'bg-[var(--empty-avatar-bg)]',
    )
  })
})