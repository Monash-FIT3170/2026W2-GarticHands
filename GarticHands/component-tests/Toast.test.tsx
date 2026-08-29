/**
 * Toast.test.tsx
 *
 * Component and hook tests for Toast and useToast
 * (client/src/components/ui/Toast).
 *
 * Toast itself is a simple presentational component: it renders nothing
 * when visible is false, and renders the message with variant specific
 * classes when visible is true.
 *
 * useToast is the stateful helper most pages actually use. Calling show
 * makes the toast visible with the given message, and after durationMs
 * (default 2000ms) it automatically hides itself again. Fake timers are
 * used so the automatic hide can be tested without waiting in real time.
 */

import { render, screen, act, renderHook } from '@testing-library/react'
import '@testing-library/jest-dom'
import Toast, { useToast } from '../client/src/components/ui/Toast'

describe('Toast', () => {
  test('renders nothing when not visible', () => {
    const { container } = render(<Toast message="Hello" visible={false} />)

    expect(container).toBeEmptyDOMElement()
  })

  test('renders the message when visible', () => {
    render(<Toast message="Copied to clipboard" visible />)

    expect(screen.getByText('Copied to clipboard')).toBeInTheDocument()
  })

  test('defaults to the pill variant classes', () => {
    render(<Toast message="Hi" visible />)

    expect(screen.getByText('Hi')).toHaveClass('rounded-full', 'bg-[#2F4542]')
  })

  test('applies the default variant classes when variant is set to default', () => {
    render(<Toast message="Hi" visible variant="default" />)

    expect(screen.getByText('Hi')).toHaveClass('rounded', 'bg-gray-700')
  })
})

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('toast is not visible before show is called', () => {
    const { result } = renderHook(() => useToast())

    const { container } = render(result.current.toast)
    expect(container).toBeEmptyDOMElement()
  })

  test('calling show makes the toast visible with the given message', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.show('Saved')
    })

    const { getByText } = render(result.current.toast)
    expect(getByText('Saved')).toBeInTheDocument()
  })

  test('toast automatically hides after the default duration', () => {
    const { result, rerender } = renderHook(() => useToast())

    act(() => {
      result.current.show('Saved')
    })

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    rerender()

    const { container } = render(result.current.toast)
    expect(container).toBeEmptyDOMElement()
  })

  test('toast respects a custom duration', () => {
    const { result, rerender } = renderHook(() => useToast('pill', 5000))

    act(() => {
      result.current.show('Saved')
    })

    // Not yet hidden at 2000ms with a 5000ms duration.
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    rerender()
    const stillVisible = render(result.current.toast)
    expect(stillVisible.getByText('Saved')).toBeInTheDocument()

    // Hidden once the full 5000ms has passed.
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    rerender()
    const nowHidden = render(result.current.toast)
    expect(nowHidden.container).toBeEmptyDOMElement()
  })
})