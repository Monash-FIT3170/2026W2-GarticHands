/**
 * DrawingStage.test.tsx
 *
 * Component tests for `<DrawingStage />` (client/src/drawing/DrawingStage).
 *
 * `DrawingStage` picks a camera/canvas layout based on the `mode` prop:
 *  - 'split':   one camera + one canvas, side by side.
 *  - 'overlay': one camera, with TWO canvases stacked on top of it,
 *               a hidden black-stroke "primary" canvas (the one actually
 *               submitted) plus a visible white-stroke canvas the user draws
 *               on directly over the camera feed.
 *  - 'both':    one camera (with its own white-stroke overlay canvas) next to
 *               a separate black-stroke canvas that's the one submitted.
 *
 * The real `DrawingCameraInput` and `DrawingCameraCanvas` components are
 * mocked out here, this file only cares about DrawingStage's layout logic
 * (how many of each element it renders per mode), not their internals.
 */

import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DrawingStage } from "../client/src/drawing/DrawingStage";

// Stub out the camera input with a simple div carrying a test id.
vi.mock('../client/src/drawing/components/DrawingCameraInput', () => ({
  default: () => <div data-testid="camera-input" />,
}))

// Stub out the canvas component the same way. Note DrawingStage can render
// this MORE THAN ONCE per mode (see 'overlay' and 'both' below), so tests
// must account for multiple matching elements where relevant.
vi.mock('../client/src/drawing/components/DrawingCameraCanvas', () => ({
  default: ({ className }: { className?: string }) => (
    <div data-testid="camera-canvas" className={className} />
  ),
}))

describe('DrawingStage', () => {
  test('renders the camera and canvas in split mode', () => {
    render(<DrawingStage mode="split" />)

    // Split mode: exactly one camera, one canvas, safe to use the singular
    // `getByTestId` query since only one of each is expected.
    expect(screen.getByTestId('camera-input')).toBeInTheDocument()
    expect(screen.getByTestId('camera-canvas')).toBeInTheDocument()
  })

  test('includes pink and white in the preset colour buttons', () => {
    render(<DrawingStage mode="split" presentation="game" />)

    expect(
      screen.getByRole('button', { name: 'Select colour #EC4899' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Select colour #FFFFFF' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Select colour #000000' }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('+')).toBeInTheDocument()
  })

  test('labels the prompt in the game banner', () => {
    render(
      <DrawingStage mode="split" presentation="game" prompt="a flying cat" />,
    )

    expect(screen.getByText('Your prompt is:')).toBeInTheDocument()
    expect(screen.getByText('a flying cat')).toBeInTheDocument()
  })

  test('changes pencil and eraser icon colours with the active tool', () => {
    const { rerender } = render(
      <DrawingStage mode="split" presentation="game" tool="draw" />,
    )

    expect(
      screen.getByRole('button', { name: 'Pencil tool' }).querySelector('path'),
    ).toHaveAttribute('fill', 'white')
    expect(
      screen.getByRole('button', { name: 'Eraser tool' }).querySelectorAll('path')[0],
    ).toHaveAttribute('fill', 'var(--action)')

    rerender(<DrawingStage mode="split" presentation="game" tool="erase" />)

    expect(
      screen.getByRole('button', { name: 'Pencil tool' }).querySelector('path'),
    ).toHaveAttribute('fill', 'var(--action)')
    expect(
      screen.getByRole('button', { name: 'Eraser tool' }).querySelectorAll('path')[0],
    ).toHaveAttribute('fill', 'white')
  })

  test('keeps the color palette visible but disabled in eraser mode', () => {
    render(<DrawingStage mode="split" presentation="game" tool="erase" />)

    const colorButton = screen.getByRole('button', { name: 'Select colour #EC4899' })

    expect(colorButton).toBeInTheDocument()
    expect(colorButton).toBeDisabled()
    expect(colorButton.parentElement?.parentElement).toHaveClass(
      'pointer-events-none',
      'opacity-40',
    )
    expect(screen.getByRole('button', { name: 'Select eraser size 18 pixels' })).toBeEnabled()
  })

  test('renders the camera and overlay canvas in overlay mode', () => {
    render(<DrawingStage mode="overlay" />)

    // Overlay mode intentionally mounts TWO canvases: a hidden black-stroke
    // "primary" canvas (used for submission) and a visible white-stroke
    // canvas drawn directly over the camera. `getAllByTestId` + length check
    // is required here, `getByTestId` would throw on multiple matches.
    expect(screen.getByTestId('camera-input')).toBeInTheDocument()
    const canvases = screen.getAllByTestId('camera-canvas')
    expect(canvases).toHaveLength(2)
    expect(canvases[0]).toHaveClass('absolute', 'inset-0', 'opacity-0')
    expect(canvases[1]).toHaveClass('absolute', 'inset-0')
  })

  test('renders the required drawing elements in both mode', () => {
    render(<DrawingStage mode="both" />)

    // "Both" mode also mounts two canvases: one overlay canvas paired with
    // the camera, and one separate canvas alongside it that's submitted.
    expect(screen.getByTestId('camera-input')).toBeInTheDocument()
    expect(screen.getAllByTestId('camera-canvas')).toHaveLength(2)
  })

  test('disables tool and size controls when drawing is disabled', () => {
    render(<DrawingStage mode="split" presentation="game" drawingEnabled={false} />)

    expect(screen.getByRole('button', { name: 'Pencil tool' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Eraser tool' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Select thickness 4 pixels' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Select colour #000000' })).toBeDisabled()
  })
})