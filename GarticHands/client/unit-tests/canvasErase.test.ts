import { describe, it, expect, vi } from 'vitest'
import { CanvasErase } from '../src/drawing/components/CanvasOperations/CanvasErase'
import { GestureType } from '../src/drawing/gestures/GestureTypes'

function createMockCtx() {
  return {
    globalCompositeOperation: '',
    lineWidth: 0,
    lineCap: '',
    lineJoin: '',
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
  } as unknown as CanvasRenderingContext2D
}

describe('CanvasErase', () => {
  it('has the correct static contract', () => {
    const erase = new CanvasErase(createMockCtx())
    expect(erase.name).toBe('erase')
    expect(erase.activatedBy).toBe(GestureType.OPEN_PALM)
  })

  it('draws a stamp (arc + fill) on the first tick, not a line', () => {
    const ctx = createMockCtx()
    const erase = new CanvasErase(ctx)

    erase.tick({ x: 10, y: 10 })

    expect(ctx.arc).toHaveBeenCalledTimes(1)
    expect(ctx.fill).toHaveBeenCalledTimes(1)
    expect(ctx.lineTo).not.toHaveBeenCalled()
    expect(ctx.stroke).not.toHaveBeenCalled()
  })

  it('draws a connecting line on the second tick', () => {
    const ctx = createMockCtx()
    const erase = new CanvasErase(ctx)

    erase.tick({ x: 0, y: 0 })
    erase.tick({ x: 10, y: 0 })

    expect(ctx.moveTo).toHaveBeenCalledWith(0, 0)
    expect(ctx.lineTo).toHaveBeenCalledWith(10, 0)
    expect(ctx.stroke).toHaveBeenCalledTimes(1)
  })

  it('uses destination-out compositing so it erases rather than paints', () => {
    const ctx = createMockCtx()
    const erase = new CanvasErase(ctx)

    erase.tick({ x: 5, y: 5 })

    expect(ctx.globalCompositeOperation).toBe('destination-out')
  })

  it('reset() clears prev so the next tick draws a stamp again', () => {
    const ctx = createMockCtx()
    const erase = new CanvasErase(ctx)

    erase.tick({ x: 0, y: 0 })
    erase.tick({ x: 10, y: 0 })
    erase.reset()
    ctx.arc = vi.fn()
    ctx.lineTo = vi.fn()

    erase.tick({ x: 50, y: 50 })

    expect(ctx.arc).toHaveBeenCalledTimes(1)
    expect(ctx.lineTo).not.toHaveBeenCalled()
  })
})