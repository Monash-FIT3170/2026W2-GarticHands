/**
 * CountdownTimer.test.tsx
 *
 * Component tests for `<CountdownTimer />` (client/src/components/ui/CountdownTimer).
 *
 * What's being verified:
 *  - The timer renders with the correct initial seconds value.
 *  - It ticks down once per second as time passes.
 *  - It fires `onExpire` exactly once when it reaches 0.
 *  - It does NOT count down while the `paused` prop is set.
 *  - It applies "urgent" styling once the remaining seconds drop below `urgentAt`.
 *
 * These tests use Vitest's fake timers (`vi.useFakeTimers`) so we can fast-forward
 * time deterministically instead of waiting on real `setInterval`/`setTimeout` calls.
 */

import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { act } from 'react'
import CountdownTimer from "../client/src/components/ui/CountdownTimer";

describe('CountdownTimer', () => {
  // Swap in fake timers before each test so `vi.advanceTimersByTime()` works
  // instead of relying on real wall-clock time.
  beforeEach(() => {
    vi.useFakeTimers()
  })

  // Restore real timers after each test so fake time doesn't leak into other
  // test files / suites.
  afterEach(() => {
    vi.useRealTimers()
  })

  test('starts with the supplied number of seconds', () => {
    render(<CountdownTimer seconds={10} />)

    // On first render, before any time has passed, it should show the full count.
    expect(screen.getByText('10s left')).toBeInTheDocument()
  })

  test('counts down once per second', () => {
    render(<CountdownTimer seconds={10} />)

    // Fast-forward 3 seconds of fake time in one go.
    // `act()` ensures React flushes the resulting state updates before we assert.
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    // 10s - 3s = 7s remaining.
    expect(screen.getByText('7s left')).toBeInTheDocument()
  })

  test('calls onExpire when the timer reaches zero', () => {
    const onExpire = vi.fn() // mock callback to track how many times it's called

    render(
      <CountdownTimer
        seconds={3}
        onExpire={onExpire}
      />,
    )

    // Advance exactly to the moment the timer should hit 0.
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByText('0s left')).toBeInTheDocument()
    // onExpire should fire exactly once, not repeatedly on every tick after 0.
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  test('does not count down while paused', () => {
    render(
      <CountdownTimer
        seconds={10}
        paused
      />,
    )

    // Even though 5 seconds of fake time pass, the paused timer shouldn't move.
    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(screen.getByText('10s left')).toBeInTheDocument()
  })

  test('uses the urgent styling below the configured threshold', () => {
    render(
      <CountdownTimer
        seconds={5}
        urgentAt={10}
      />,
    )

    // seconds (5) is below urgentAt (10), so the "urgent" red styling should apply
    // immediately on render, without needing to advance any time.
    expect(screen.getByText('5s left')).toHaveClass('text-red-400')
  })
})