import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DrawingStage } from '../src/drawing/DrawingStage'

vi.mock('../src/drawing/components/DrawingCameraInput', () => ({
  default: () => <div data-testid="camera-input" />,
}))

vi.mock('../src/drawing/components/DrawingCameraCanvas', () => ({
  default: () => <div data-testid="camera-canvas" />,
}))

describe('DrawingStage', () => {
  test('renders the camera and canvas in split mode', () => {
    render(<DrawingStage mode="split" />)

    expect(screen.getByTestId('camera-input')).toBeInTheDocument()
    expect(screen.getByTestId('camera-canvas')).toBeInTheDocument()
  })

  test('renders the camera and overlay canvas in overlay mode', () => {
    render(<DrawingStage mode="overlay" />)

    expect(screen.getByTestId('camera-input')).toBeInTheDocument()
    expect(screen.getByTestId('camera-canvas')).toBeInTheDocument()
  })

  test('renders the required drawing elements in both mode', () => {
    render(<DrawingStage mode="both" />)

    expect(screen.getByTestId('camera-input')).toBeInTheDocument()
    expect(screen.getAllByTestId('camera-canvas')).toHaveLength(2)
  })
})