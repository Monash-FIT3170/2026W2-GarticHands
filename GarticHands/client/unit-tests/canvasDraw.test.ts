import { describe, it, expect, vi } from 'vitest';
import { CanvasDraw } from '../src/drawing/components/CanvasOperations/CanvasDraw';
import { GestureType } from '../src/drawing/gestures/GestureTypes';

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
  } as unknown as CanvasRenderingContext2D;
}

describe('CanvasDraw', () => {
  it('has the correct static contract', () => {
    const draw = new CanvasDraw(createMockCtx());
    expect(draw.name).toBe('draw');
    expect(draw.activatedBy).toBe(GestureType.PINCH);
  });

  it('draws nothing on the first tick — only stores the initial sample', () => {
    const ctx = createMockCtx();
    const draw = new CanvasDraw(ctx);

    draw.tick({ x: 10, y: 10 });

    expect(ctx.stroke).not.toHaveBeenCalled();
  });

  it('draws a straight line on the second tick', () => {
    const ctx = createMockCtx();
    const draw = new CanvasDraw(ctx);

    draw.tick({ x: 0, y: 0 });
    draw.tick({ x: 10, y: 0 });

    expect(ctx.moveTo).toHaveBeenCalledTimes(1);
    expect(ctx.lineTo).toHaveBeenCalledTimes(1);
    expect(ctx.quadraticCurveTo).not.toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalledTimes(1);
  });

  it('draws a quadratic curve from the third tick onward', () => {
    const ctx = createMockCtx();
    const draw = new CanvasDraw(ctx);

    draw.tick({ x: 0, y: 0 });
    draw.tick({ x: 10, y: 0 });
    draw.tick({ x: 20, y: 0 });

    expect(ctx.quadraticCurveTo).toHaveBeenCalledTimes(1);
    expect(ctx.stroke).toHaveBeenCalledTimes(2);
  });

  it('applies smoothing rather than drawing straight to the raw point', () => {
    const ctx = createMockCtx() as CanvasRenderingContext2D & {
      lineTo: ReturnType<typeof vi.fn>;
    };
    const draw = new CanvasDraw(ctx);

    draw.tick({ x: 0, y: 0 });
    draw.tick({ x: 10, y: 0 });

    const lineToCall = ctx.lineTo.mock.calls[0];

    expect(lineToCall).toBeDefined();

    const [x, y] = lineToCall;

    // The One Euro filter should smooth the raw movement,
    // so the first segment should not jump directly to x = 10.
    expect(x).toBeGreaterThan(0);
    expect(x).toBeLessThan(10);
    expect(y).toBe(0);
  });

  it('reset() clears state so the next tick behaves like a first tick again', () => {
    const ctx = createMockCtx();
    const draw = new CanvasDraw(ctx);

    draw.tick({ x: 0, y: 0 });
    draw.tick({ x: 10, y: 0 });
    draw.reset();
    ctx.stroke = vi.fn();

    draw.tick({ x: 50, y: 50 });

    expect(ctx.stroke).not.toHaveBeenCalled();
  });
});
