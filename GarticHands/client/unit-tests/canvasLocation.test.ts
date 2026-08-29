import { describe, it, expect, vi } from 'vitest'
import { CanvasLocation } from '../src/drawing/components/CanvasOperations/CanvasLocation'
import { GestureType } from '../src/drawing/gestures/GestureTypes'

function createMockCtx() {
  return {
    canvas: { width: 640, height: 480 },
    fillStyle: '',
    font: '',
    textAlign: '',
    textBaseline: '',
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    fillText: vi.fn(),
  } as unknown as CanvasRenderingContext2D
}

describe('CanvasLocation', () => {
  it('clears the canvas on every render() call', () => {
    const ctx = createMockCtx()
    const location = new CanvasLocation(ctx)

    location.render({ x: 1, y: 1 }, GestureType.HAND_PRESENT)

    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 640, 480)
  })

  it('draws the pencil glyph on PINCH', () => {
    const ctx = createMockCtx()
    const location = new CanvasLocation(ctx)

    location.render({ x: 1, y: 1 }, GestureType.PINCH)

    expect(ctx.fillText).toHaveBeenCalledWith('✏️', 1, 1)
  })

  it('draws the sponge glyph on OPEN_PALM', () => {
    const ctx = createMockCtx()
    const location = new CanvasLocation(ctx)

    location.render({ x: 1, y: 1 }, GestureType.OPEN_PALM)

    expect(ctx.fillText).toHaveBeenCalledWith('🧽', 1, 1)
  })

  it('draws a plain pointer circle on HAND_PRESENT, not a glyph', () => {
    const ctx = createMockCtx()
    const location = new CanvasLocation(ctx)

    location.render({ x: 1, y: 1 }, GestureType.HAND_PRESENT)

    expect(ctx.arc).toHaveBeenCalledTimes(1)
    expect(ctx.fill).toHaveBeenCalledTimes(1)
    expect(ctx.fillText).not.toHaveBeenCalled()
  })

  it('draws nothing further on NO_HAND beyond the clear', () => {
    const ctx = createMockCtx()
    const location = new CanvasLocation(ctx)

    location.render({ x: 1, y: 1 }, GestureType.NO_HAND)

    expect(ctx.arc).not.toHaveBeenCalled()
    expect(ctx.fillText).not.toHaveBeenCalled()
  })

  it('clear() clears the canvas independently of render()', () => {
    const ctx = createMockCtx()
    const location = new CanvasLocation(ctx)

    location.clear()

    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 640, 480)
  })
})