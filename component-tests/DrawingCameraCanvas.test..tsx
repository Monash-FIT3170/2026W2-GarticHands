import { render, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import DrawingCameraCanvas from '../src/drawing/components/DrawingCameraCanvas'

const registerCanvas = vi.fn(() => vi.fn())

const mockCanvas = vi.fn(() => (
  <canvas data-testid="drawing-canvas" />
))

vi.mock('../src/drawing/DrawingContext', () => ({
  useDrawingContext: () => ({
    registerCanvas,
  }),
}))

vi.mock('../src/drawing/components/Canvas', () => ({
  default: (props: {
    width?: number
    height?: number
    strokeColor?: string
    className?: string
  }) => {
    mockCanvas(props)
    return <canvas data-testid="drawing-canvas" />
  },
}))

describe('DrawingCameraCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders the Canvas component', () => {
    render(<DrawingCameraCanvas />)

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

    expect(mockCanvas).toHaveBeenCalledWith(
      expect.objectContaining({
        className: 'absolute inset-0',
      }),
    )
  })

  test('registers the Canvas handle with the drawing context', async () => {
    render(<DrawingCameraCanvas />)

    await waitFor(() => {
      expect(registerCanvas).toHaveBeenCalledTimes(1)
    })
  })
})