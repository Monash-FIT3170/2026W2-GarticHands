import { describe, it, expect, vi } from 'vitest'
import { CanvasDraw } from '../src/drawing/components/CanvasOperations/CanvasDraw'
import { GestureType } from '../src/drawing/gestures/GestureTypes'

function createMockCtx() {
  return {
    strokeStyle: '',
    lineWidth: 0,
    lineCap: '',
    lineJoin: '',
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    stroke: vi.fn(),
  } as unknown as CanvasRenderingContext2D
}

describe('CanvasDraw', () => {
  it('has the correct static contract', () => {
    const draw = new CanvasDraw(createMockCtx())
    expect(draw.name).toBe('draw')
    expect(draw.activatedBy).toBe(GestureType.PINCH)
  })

  it('draws nothing on the first tick — only stores the initial sample', () => {
    const ctx = createMockCtx()
    const draw = new CanvasDraw(ctx)

    draw.tick({ x: 10, y: 10 })

    expect(ctx.stroke).not.toHaveBeenCalled()
  })

  it('draws a straight line on the second tick', () => {
    const ctx = createMockCtx()
    const draw = new CanvasDraw(ctx)

    draw.tick({ x: 0, y: 0 })
    draw.tick({ x: 10, y: 0 })

    expect(ctx.moveTo).toHaveBeenCalledTimes(1)
    expect(ctx.lineTo).toHaveBeenCalledTimes(1)
    expect(ctx.quadraticCurveTo).not.toHaveBeenCalled()
    expect(ctx.stroke).toHaveBeenCalledTimes(1)
  })

  it('draws a quadratic curve from the third tick onward', () => {
    const ctx = createMockCtx()
    const draw = new CanvasDraw(ctx)

    draw.tick({ x: 0, y: 0 })
    draw.tick({ x: 10, y: 0 })
    draw.tick({ x: 20, y: 0 })

    expect(ctx.quadraticCurveTo).toHaveBeenCalledTimes(1)
    expect(ctx.stroke).toHaveBeenCalledTimes(2)
  })

  it('applies EMA smoothing rather than drawing straight to the raw point', () => {
    const ctx = createMockCtx()
    const draw = new CanvasDraw(ctx)

    // alpha = 0.5, so smoothed point after tick 2 = midpoint of (0,0) and (10,0) = (5,0)
    draw.tick({ x: 0, y: 0 })
    draw.tick({ x: 10, y: 0 })

    // first segment: moveTo(prevSmoothed) -> lineTo(mid of prevSmoothed & smoothed)
    // prevSmoothed = (0,0) [unchanged from first tick, no prior average to blend with]
    // smoothed = 0.5*10 + 0.5*0 = 5 -> mid = (0+5)/2 = 2.5
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 0)
    expect(ctx.lineTo).toHaveBeenCalledWith(2.5, 0)
  })

  it('reset() clears state so the next tick behaves like a first tick again', () => {
    const ctx = createMockCtx()
    const draw = new CanvasDraw(ctx)

    draw.tick({ x: 0, y: 0 })
    draw.tick({ x: 10, y: 0 })
    draw.reset()
    ctx.stroke = vi.fn() // reset the spy call count cleanly

    draw.tick({ x: 50, y: 50 })

    expect(ctx.stroke).not.toHaveBeenCalled()
  })
})