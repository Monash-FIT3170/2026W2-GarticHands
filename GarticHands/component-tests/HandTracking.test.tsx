/**
 * HandTracking.test.tsx
 *
 * Component tests for HandTracking (client/src/drawing/components/HandTracking).
 *
 * HandTracking renders a hidden video element plus a landmark overlay
 * canvas, and a status pill in the bottom left corner whose content
 * depends on the state returned by useHandTracking:
 *  - an error message, when error is set.
 *  - a loading message, when isLoading is true and there is no error.
 *  - otherwise, a hand detected or show your hand pill plus the current
 *    gesture label.
 *
 * It also registers its canvas element with the surrounding drawing
 * context on mount, so the recorder can composite the camera feed later.
 *
 * useHandTracking and useDrawingContext are mocked here so each status
 * branch can be tested directly by controlling their mocked return
 * values, without needing a real camera or MediaPipe model.
 */

import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import HandTracking from '../client/src/drawing/components/HandTracking'

const registerCameraCanvas = vi.fn(() => vi.fn())
const mockUseHandTracking = vi.fn()

vi.mock('../client/src/drawing/DrawingContext', () => ({
  useDrawingContext: () => ({
    registerCameraCanvas,
  }),
}))

vi.mock('../client/src/drawing/hooks/useHandTracking', () => ({
  useHandTracking: (...args: unknown[]) => mockUseHandTracking(...args),
}))

describe('HandTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('registers the canvas element with the drawing context on mount', () => {
    mockUseHandTracking.mockReturnValue({
      isLoading: false,
      error: null,
      handDetected: false,
      gesture: 'NO_HAND',
    })

    render(<HandTracking />)

    expect(registerCameraCanvas).toHaveBeenCalledTimes(1)
    expect(registerCameraCanvas).toHaveBeenCalledWith(expect.any(HTMLCanvasElement))
  })

  test('shows the error message when error is set', () => {
    mockUseHandTracking.mockReturnValue({
      isLoading: false,
      error: 'Camera permission denied',
      handDetected: false,
      gesture: 'NO_HAND',
    })

    render(<HandTracking />)

    expect(screen.getByText('Camera permission denied')).toBeInTheDocument()
  })

  test('shows the loading message when loading and there is no error', () => {
    mockUseHandTracking.mockReturnValue({
      isLoading: true,
      error: null,
      handDetected: false,
      gesture: 'NO_HAND',
    })

    render(<HandTracking />)

    expect(screen.getByText('Loading camera...')).toBeInTheDocument()
  })

  test('prioritises the error message over the loading message', () => {
    mockUseHandTracking.mockReturnValue({
      isLoading: true,
      error: 'Camera permission denied',
      handDetected: false,
      gesture: 'NO_HAND',
    })

    render(<HandTracking />)

    expect(screen.getByText('Camera permission denied')).toBeInTheDocument()
    expect(screen.queryByText('Loading camera...')).not.toBeInTheDocument()
  })

  test('shows "Show your hand" and the gesture label when no hand is detected', () => {
    mockUseHandTracking.mockReturnValue({
      isLoading: false,
      error: null,
      handDetected: false,
      gesture: 'NO_HAND',
    })

    render(<HandTracking />)

    expect(screen.getByText('Show your hand')).toBeInTheDocument()
    expect(screen.getByText('NO_HAND')).toBeInTheDocument()
  })

  test('shows "Hand detected" and the gesture label when a hand is detected', () => {
    mockUseHandTracking.mockReturnValue({
      isLoading: false,
      error: null,
      handDetected: true,
      gesture: 'PINCH',
    })

    render(<HandTracking />)

    expect(screen.getByText('Hand detected')).toBeInTheDocument()
    expect(screen.getByText('PINCH')).toBeInTheDocument()
  })

  test('forwards videoRef, canvasRef, and onFrame to useHandTracking', () => {
    mockUseHandTracking.mockReturnValue({
      isLoading: false,
      error: null,
      handDetected: false,
      gesture: 'NO_HAND',
    })
    const onFrame = vi.fn()

    render(<HandTracking onFrame={onFrame} />)

    expect(mockUseHandTracking).toHaveBeenCalledWith(
      expect.objectContaining({
        videoRef: expect.objectContaining({ current: expect.any(HTMLVideoElement) }),
        canvasRef: expect.objectContaining({ current: expect.any(HTMLCanvasElement) }),
        onFrame,
      }),
    )
  })
})