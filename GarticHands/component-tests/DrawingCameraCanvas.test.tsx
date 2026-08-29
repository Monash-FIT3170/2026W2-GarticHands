/**
 * DrawingCameraCanvas.test.tsx
 *
 * Component tests for `<DrawingCameraCanvas />`
 * (client/src/drawing/components/DrawingCameraCanvas).
 *
 * `DrawingCameraCanvas` is a thin wrapper around the lower-level `<Canvas />`
 * component that also registers itself with the surrounding drawing context
 * (so the app can later grab the canvas handle to read/submit strokes).
 *
 * Rather than testing the real `<Canvas />` (which does actual canvas drawing
 * logic we don't care about here) and the real `DrawingContext`, both are
 * mocked out below. This lets the tests focus purely on what
 * `DrawingCameraCanvas` itself is responsible for:
 *  - Rendering exactly one `<Canvas />`.
 *  - Forwarding its props (`width`, `height`, `strokeColor`, `className`) to it correctly.
 *  - Registering its canvas handle with `useDrawingContext().registerCanvas`.
 */

import { render, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import DrawingCameraCanvas from '../client/src/drawing/components/DrawingCameraCanvas'

// Mock of the `registerCanvas` function that the real DrawingContext would provide.
// It returns a cleanup function (also mocked), matching the real API shape.
const registerCanvas = vi.fn(() => vi.fn())

// Spy used to inspect what props the mocked `<Canvas />` was rendered with,
// without needing to render the real canvas-drawing implementation.
const mockCanvas = vi.fn((_props: {
  width?: number
  height?: number
  strokeColor?: string
  className?: string
}) => (
  <canvas data-testid="drawing-canvas" />
))

// Replace the real DrawingContext hook with a stub that just returns our mock
// `registerCanvas`, so we can assert on how/when it's called.
vi.mock('../client/src/drawing/DrawingContext', () => ({
  useDrawingContext: () => ({
    registerCanvas,
  }),
}))

// Replace the real `<Canvas />` with a lightweight stand-in that forwards its
// props to `mockCanvas` (so tests can assert on them) and renders a simple
// `<canvas>` element with a test id.
vi.mock('../client/src/drawing/components/Canvas', async () => {
  const React = await import('react')

  return {
    default: React.forwardRef(function MockCanvas(_props, ref) {
      const handle = {
        getCanvas: vi.fn(),
      }

      React.useImperativeHandle(ref, () => handle)

      mockCanvas(_props)

      return <canvas data-testid="drawing-canvas" />
    }),
  }
})

describe('DrawingCameraCanvas', () => {
  // Reset mock call history before every test so assertions like
  // `toHaveBeenCalledTimes(1)` aren't polluted by previous tests.
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders the Canvas component', () => {
    render(<DrawingCameraCanvas />)

    // Exactly one underlying Canvas should be mounted per DrawingCameraCanvas.
    expect(mockCanvas).toHaveBeenCalledTimes(1)
  })

  test('passes the configured dimensions and stroke colour to Canvas', () => {
    render(
      <DrawingCameraCanvas
        width={640}
        height={480}
        strokeColor="white"
      />,
    )

    // Confirm width/height/strokeColor props are forwarded unchanged to Canvas.
    expect(mockCanvas).toHaveBeenCalledWith(
      expect.objectContaining({
        width: 640,
        height: 480,
        strokeColor: 'white',
      }),
    )
  })

  test('passes the wrapper class to Canvas', () => {
    render(
      <DrawingCameraCanvas
        className="absolute inset-0"
      />,
    )

    // Confirm custom className is forwarded to Canvas (used for positioning
    // overlay canvases, e.g. in DrawingStage's overlay/both layouts).
    expect(mockCanvas).toHaveBeenCalledWith(
      expect.objectContaining({
        className: 'absolute inset-0',
      }),
    )
  })

  test('registers the Canvas handle with the drawing context', async () => {
    render(<DrawingCameraCanvas />)

    // Registration may happen after mount (e.g. inside a useEffect), so we
    // wait for it rather than asserting immediately after render.
    await waitFor(() => {
      expect(registerCanvas).toHaveBeenCalledTimes(1)
    })
  })
})