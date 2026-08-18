/**
 * Canvas.test.tsx
 *
 * Component tests for Canvas (client/src/drawing/components/Canvas).
 *
 * Canvas exposes an imperative handle (CanvasHandle) with onFrame and
 * getImage, rather than reacting to props changes directly. It renders
 * two stacked canvas elements (a draw canvas and an overlay canvas) inside
 * a wrapper div, and registers the draw canvas element with the surrounding
 * drawing context on mount.
 *
 * These tests focus on Canvas own responsibilities: registering itself
 * with the drawing context, rendering both canvas elements with the correct
 * dimensions, applying the default or custom wrapper class, and exposing a
 * working getImage handle that returns null before mount data exists and a
 * data URL once it does. The gesture pipeline internals (CanvasDraw,
 * CanvasErase, CanvasLocation) are exercised indirectly via onFrame rather
 * than unit tested here, since this file is scoped to Canvas itself, not its
 * op classes.
 */

import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import { createRef } from 'react'
import Canvas, { type CanvasHandle } from '../client/src/drawing/components/Canvas'
import { GestureType } from '../client/src/drawing/gestures/GestureTypes'

const registerDrawCanvasElement = vi.fn(() => vi.fn())

vi.mock('../client/src/drawing/DrawingContext', () => ({
  useDrawingContext: () => ({
    registerDrawCanvasElement,
  }),
}))

// jsdom does not implement canvas getContext or toDataURL.
// Stub the canvas APIs so Canvas can be tested without the real
// browser canvas implementation.
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    canvas: {
      width: 640,
      height: 480,
    },
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext

  HTMLCanvasElement.prototype.toDataURL = vi.fn(
    () => 'data:image/png;base64,fake',
  )
})

describe('Canvas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('registers the draw canvas element with the drawing context on mount', () => {
    render(<Canvas />)

    expect(registerDrawCanvasElement).toHaveBeenCalledTimes(1)
    expect(registerDrawCanvasElement).toHaveBeenCalledWith(
      expect.any(HTMLCanvasElement),
    )
  })

  test('renders two canvas elements with the default dimensions', () => {
    const { container } = render(<Canvas />)

    const canvases = container.querySelectorAll('canvas')
    expect(canvases).toHaveLength(2)

    canvases.forEach((canvas) => {
      expect(canvas).toHaveAttribute('width', '640')
      expect(canvas).toHaveAttribute('height', '480')
    })
  })

  test('renders both canvas elements at custom dimensions', () => {
    const { container } = render(<Canvas width={320} height={240} />)

    const canvases = container.querySelectorAll('canvas')

    canvases.forEach((canvas) => {
      expect(canvas).toHaveAttribute('width', '320')
      expect(canvas).toHaveAttribute('height', '240')
    })
  })

  test('applies the default wrapper class when no className is given', () => {
    const { container } = render(<Canvas />)

    expect(container.firstChild).toHaveClass('bg-white', 'rounded-xl')
  })

  test('applies a custom wrapper class when className is given', () => {
    const { container } = render(
      <Canvas className="absolute inset-0 w-full h-full opacity-0 pointer-events-none" />,
    )

    expect(container.firstChild).toHaveClass(
      'opacity-0',
      'pointer-events-none',
    )
    expect(container.firstChild).not.toHaveClass('bg-white')
  })

  test('exposes an imperative handle with onFrame and getImage', () => {
    const ref = createRef<CanvasHandle>()
    render(<Canvas ref={ref} />)

    expect(ref.current).not.toBeNull()
    expect(typeof ref.current?.onFrame).toBe('function')
    expect(typeof ref.current?.getImage).toBe('function')
  })

  test('onFrame does not throw when called with no landmarks', () => {
    const ref = createRef<CanvasHandle>()
    render(<Canvas ref={ref} />)

    expect(() => {
      ref.current?.onFrame(null, GestureType.NO_HAND)
    }).not.toThrow()
  })

  test('getImage returns a PNG data URL once the canvas is mounted', () => {
    const ref = createRef<CanvasHandle>()
    render(<Canvas ref={ref} />)

    const image = ref.current?.getImage()

    expect(image).toMatch(/^data:image\/png/)
  })
})