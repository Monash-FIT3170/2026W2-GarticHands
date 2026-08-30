import { describe, it, expect, vi } from 'vitest';
import { drawLandmarks, drawConnections } from '../src/drawing/utils/drawHand';
import { HAND_CONNECTIONS } from '../src/drawing/constants/handConnections';
import type { HandLandmark } from '../src/drawing/Models/HandLandmark';

function createMockCtx() {
  return {
    canvas: { width: 200, height: 100 },
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

const landmarks: HandLandmark[] = Array.from({ length: 21 }, (_, i) => ({
  x: i / 21,
  y: i / 21,
  z: 0,
}));

describe('drawLandmarks', () => {
  it('sets fillStyle to red', () => {
    const ctx = createMockCtx();
    drawLandmarks(ctx, landmarks);
    expect(ctx.fillStyle).toBe('red');
  });

  it('draws one arc + fill per landmark', () => {
    const ctx = createMockCtx();
    drawLandmarks(ctx, landmarks);
    expect(ctx.arc).toHaveBeenCalledTimes(21);
    expect(ctx.fill).toHaveBeenCalledTimes(21);
  });

  it('scales landmark coordinates by the canvas width/height', () => {
    const ctx = createMockCtx();
    drawLandmarks(ctx, [{ x: 0.5, y: 0.25, z: 0 }]);
    // canvas is 200x100 -> expected pixel position (100, 25)
    expect(ctx.arc).toHaveBeenCalledWith(100, 25, 4, 0, Math.PI * 2);
  });

  it('draws nothing for an empty landmark array', () => {
    const ctx = createMockCtx();
    drawLandmarks(ctx, []);
    expect(ctx.arc).not.toHaveBeenCalled();
    expect(ctx.fill).not.toHaveBeenCalled();
  });
});

describe('drawConnections', () => {
  it('sets strokeStyle to lime and lineWidth to 2', () => {
    const ctx = createMockCtx();
    drawConnections(ctx, landmarks);
    expect(ctx.strokeStyle).toBe('lime');
    expect(ctx.lineWidth).toBe(2);
  });

  it('draws one line per entry in HAND_CONNECTIONS', () => {
    const ctx = createMockCtx();
    drawConnections(ctx, landmarks);
    expect(ctx.moveTo).toHaveBeenCalledTimes(HAND_CONNECTIONS.length);
    expect(ctx.lineTo).toHaveBeenCalledTimes(HAND_CONNECTIONS.length);
    expect(ctx.stroke).toHaveBeenCalledTimes(HAND_CONNECTIONS.length);
  });

  it('scales both endpoints by the canvas width/height', () => {
    const ctx = createMockCtx();
    const twoPoints: HandLandmark[] = Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }));
    twoPoints[0] = { x: 0, y: 0, z: 0 };
    twoPoints[1] = { x: 1, y: 1, z: 0 };
    // HAND_CONNECTIONS' first pair is [0, 1]
    drawConnections(ctx, twoPoints);
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 0);
    expect(ctx.lineTo).toHaveBeenCalledWith(200, 100);
  });
});
