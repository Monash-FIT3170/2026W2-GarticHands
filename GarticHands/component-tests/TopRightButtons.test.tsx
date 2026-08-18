/**
 * TopRightButtons.test.tsx
 *
 * Component tests for TopRightButtons
 * (client/src/components/ui/TopRightButtons).
 *
 * TopRightButtons renders a row of three utility buttons (volume,
 * settings, rules), each identified by its accessible aria label rather
 * than visible text since the icons carry no text of their own. Each
 * button optionally calls a handler prop when clicked. The handlers are
 * all optional, so clicking a button with no handler wired up should not
 * throw.
 *
 * The icon components are mocked out here so this file only tests
 * TopRightButtons own responsibilities (rendering three buttons with the
 * right labels and wiring clicks to the right handler), not the icons
 * internal SVG markup.
 */

import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import TopRightButtons from '../client/src/components/ui/TopRightButtons'

vi.mock('../client/src/components/ui/icons/VolumeIcon', () => ({
  default: () => <svg data-testid="volume-icon" />,
}))

vi.mock('../client/src/components/ui/icons/GearIcon', () => ({
  default: () => <svg data-testid="gear-icon" />,
}))

vi.mock('../client/src/components/ui/icons/BookIcon', () => ({
  default: () => <svg data-testid="book-icon" />,
}))

describe('TopRightButtons', () => {
  test('renders all three buttons with their accessible labels', () => {
    render(<TopRightButtons />)

    expect(screen.getByLabelText('Volume')).toBeInTheDocument()
    expect(screen.getByLabelText('Settings')).toBeInTheDocument()
    expect(screen.getByLabelText('Rules')).toBeInTheDocument()
  })

  test('renders the correct icon inside each button', () => {
    render(<TopRightButtons />)

    expect(screen.getByLabelText('Volume')).toContainElement(
      screen.getByTestId('volume-icon'),
    )
    expect(screen.getByLabelText('Settings')).toContainElement(
      screen.getByTestId('gear-icon'),
    )
    expect(screen.getByLabelText('Rules')).toContainElement(
      screen.getByTestId('book-icon'),
    )
  })

  test('calls onVolume when the volume button is clicked', () => {
    const onVolume = vi.fn()
    render(<TopRightButtons onVolume={onVolume} />)

    fireEvent.click(screen.getByLabelText('Volume'))

    expect(onVolume).toHaveBeenCalledTimes(1)
  })

  test('calls onSettings when the settings button is clicked', () => {
    const onSettings = vi.fn()
    render(<TopRightButtons onSettings={onSettings} />)

    fireEvent.click(screen.getByLabelText('Settings'))

    expect(onSettings).toHaveBeenCalledTimes(1)
  })

  test('calls onRules when the rules button is clicked', () => {
    const onRules = vi.fn()
    render(<TopRightButtons onRules={onRules} />)

    fireEvent.click(screen.getByLabelText('Rules'))

    expect(onRules).toHaveBeenCalledTimes(1)
  })

  test('does not throw when a button is clicked with no handler provided', () => {
    render(<TopRightButtons />)

    expect(() => {
      fireEvent.click(screen.getByLabelText('Volume'))
      fireEvent.click(screen.getByLabelText('Settings'))
      fireEvent.click(screen.getByLabelText('Rules'))
    }).not.toThrow()
  })
})