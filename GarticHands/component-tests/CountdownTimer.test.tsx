import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { act } from 'react'
import CountdownTimer from "../client/src/components/ui/CountdownTimer";

describe('CountdownTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('starts with the supplied number of seconds', () => {
    render(<CountdownTimer seconds={10} />)

    expect(screen.getByText('10s left')).toBeInTheDocument()
  })

  test('counts down once per second', () => {
    render(<CountdownTimer seconds={10} />)

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByText('7s left')).toBeInTheDocument()
  })

  test('calls onExpire when the timer reaches zero', () => {
    const onExpire = vi.fn()

    render(
      <CountdownTimer
        seconds={3}
        onExpire={onExpire}
      />,
    )

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByText('0s left')).toBeInTheDocument()
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  test('does not count down while paused', () => {
    render(
      <CountdownTimer
        seconds={10}
        paused
      />,
    )

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

    expect(screen.getByText('5s left')).toHaveClass('text-red-400')
  })
})