/**
 * Button.test.tsx
 *
 * Component tests for `<Button />` (client/src/components/ui/Button).
 *
 * `Button` is a shared button wrapping a native `<button>`, with two
 * independent style axes:
 *  - `variant`: picks a whole class-string "look" (primary, secondary,
 *    submit, start, outline, ghost, ready) matching a specific on-screen
 *    button elsewhere in the app.
 *  - `size`: picks padding/width classes (sm, md, lg, full, custom).
 *
 * Some variants ('submit', 'start') change appearance based on `disabled`,
 * and some ('ghost', 'ready') change appearance based on `active`. It also
 * forwards standard button props (onClick, disabled, etc.) and an optional
 * extra `className`, and renders whatever `children` it's given.
 */

import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import Button from '../client/src/components/ui/Button'

describe('Button', () => {
  test('renders its children', () => {
    render(<Button>Click me</Button>)

    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  test('defaults to the primary variant and md size', () => {
    render(<Button>Default</Button>)

    const button = screen.getByText('Default')
    expect(button).toHaveClass('bg-[#2E5534]', 'text-white', 'rounded-full')
    expect(button).toHaveClass('px-5', 'py-3') // md size
  })

  test('applies the secondary variant classes', () => {
    render(<Button variant="secondary">Join Room</Button>)

    expect(screen.getByText('Join Room')).toHaveClass(
      'bg-white',
      'text-[#3D6B64]',
      'rounded-full',
    )
  })

  test('submit variant uses the enabled style when not disabled', () => {
    render(<Button variant="submit">Submit</Button>)

    expect(screen.getByText('Submit')).toHaveClass('bg-green-600', 'text-white')
  })

  test('submit variant switches to the disabled style when disabled', () => {
    render(<Button variant="submit" disabled>Submit</Button>)

    const button = screen.getByText('Submit')
    expect(button).toHaveClass('bg-gray-500', 'text-white')
    expect(button).toBeDisabled()
  })

  test('start variant uses the enabled style when not disabled', () => {
    render(<Button variant="start">Start Game</Button>)

    expect(screen.getByText('Start Game')).toHaveClass('bg-[#78EF57]', 'text-[#2E5534]')
  })

  test('start variant switches to the disabled style when disabled', () => {
    render(<Button variant="start" disabled>Start Game</Button>)

    const button = screen.getByText('Start Game')
    expect(button).toHaveClass('bg-[#9CC9C1]', 'cursor-not-allowed')
    expect(button).toBeDisabled()
  })

  test('applies the outline variant classes', () => {
    render(<Button variant="outline">Copy Invite Code</Button>)

    expect(screen.getByText('Copy Invite Code')).toHaveClass(
      'bg-white',
      'text-[#D4623E]',
      'border-[#D4623E]',
    )
  })

  test('ghost variant uses the active style when active is true', () => {
    render(<Button variant="ghost" active>Ready</Button>)

    expect(screen.getByText('Ready')).toHaveClass('bg-green-600', 'text-white')
  })

  test('ghost variant uses the inactive style when active is false or omitted', () => {
    render(<Button variant="ghost">Not Ready</Button>)

    expect(screen.getByText('Not Ready')).toHaveClass('bg-gray-500', 'text-gray-300')
  })

  test('ready variant uses the active style when active is true', () => {
    render(<Button variant="ready" active>Ready</Button>)

    expect(screen.getByText('Ready')).toHaveClass('bg-[#78EF57]', 'text-[#2E5534]')
  })

  test('ready variant uses the inactive style when active is false or omitted', () => {
    render(<Button variant="ready">Not Ready</Button>)

    expect(screen.getByText('Not Ready')).toHaveClass('bg-[#79A8A0]', 'text-[#C8DDD9]')
  })

  test('applies the correct size classes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    expect(screen.getByText('Small')).toHaveClass('px-4', 'py-2')

    rerender(<Button size="lg">Large</Button>)
    expect(screen.getByText('Large')).toHaveClass('px-6', 'py-3')

    rerender(<Button size="full">Full</Button>)
    expect(screen.getByText('Full')).toHaveClass('w-full', 'max-w-xs', 'py-3')
  })

  test('custom size applies no extra size classes, leaving room for className overrides', () => {
    render(
      <Button size="custom" className="p-2">
        Custom
      </Button>,
    )

    const button = screen.getByText('Custom')
    expect(button).toHaveClass('p-2')
    // None of the fixed padding utilities from the other sizes should be present.
    expect(button).not.toHaveClass('px-4', 'px-5', 'px-6', 'w-full')
  })

  test('merges an extra className onto the computed classes', () => {
    render(<Button className="mt-4">Spaced</Button>)

    const button = screen.getByText('Spaced')
    expect(button).toHaveClass('mt-4')
    expect(button).toHaveClass('bg-[#2E5534]') // still has its variant classes too
  })

  test('forwards native button props like onClick', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Press</Button>)

    fireEvent.click(screen.getByText('Press'))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  test('is disabled when the disabled prop is passed', () => {
    render(<Button disabled>Disabled</Button>)

    expect(screen.getByText('Disabled')).toBeDisabled()
  })
})