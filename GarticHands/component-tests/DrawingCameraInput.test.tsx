/**
 * DrawingCameraInput.test.tsx
 *
 * Component tests for DrawingCameraInput
 * (client/src/drawing/components/DrawingCameraInput).
 *
 * DrawingCameraInput is a thin wiring component: it has no props and no
 * markup of its own. Its only job is pulling pushFrame out of the
 * surrounding drawing context and forwarding it to HandTracking as the
 * onFrame prop, so every detected hand frame flows into the drawing
 * pipeline.
 *
 * Both HandTracking and useDrawingContext are mocked here so this file
 * only tests the wiring itself, not HandTracking internal camera/tracking
 * logic or the real context implementation.
 */

import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import DrawingCameraInput from '../client/src/drawing/components/DrawingCameraInput'

const pushFrame = vi.fn()

const mockHandTracking = vi.fn((_props: { onFrame?: unknown }) => (
  <div data-testid="hand-tracking" />
))

vi.mock('../client/src/drawing/DrawingContext', () => ({
  useDrawingContext: () => ({
    pushFrame,
  }),
}))

vi.mock('../client/src/drawing/components/HandTracking', () => ({
  default: (props: { onFrame?: unknown }) => {
    mockHandTracking(props)
    return <div data-testid="hand-tracking" />
  },
}))

describe('DrawingCameraInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders HandTracking', () => {
    const { getByTestId } = render(<DrawingCameraInput />)

    expect(getByTestId('hand-tracking')).toBeInTheDocument()
  })

  test('forwards the drawing context pushFrame as the onFrame prop', () => {
    render(<DrawingCameraInput />)

    expect(mockHandTracking).toHaveBeenCalledWith(
      expect.objectContaining({ onFrame: pushFrame }),
    )
  })
})