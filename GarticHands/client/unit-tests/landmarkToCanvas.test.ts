import { describe, it, expect } from 'vitest';
import { landmarkToCanvas } from '../src/drawing/gestures/coords';
import type { HandLandmark } from '../src/drawing/Models/HandLandmark';

const fakeCanvas = (width: number, height: number) => ({ width, height }) as HTMLCanvasElement;

describe('landmarkToCanvas', () => {
  it('mirrors the x coordinate to account for the flipped display canvas', () => {
    const landmark: HandLandmark = { x: 0.25, y: 0, z: 0 };
    const result = landmarkToCanvas(landmark, fakeCanvas(400, 300));
    // x should be (1 - 0.25) * 400 = 300, not 0.25 * 400
    expect(result.x).toBe(300);
  });

  it('does not mirror the y coordinate', () => {
    const landmark: HandLandmark = { x: 0, y: 0.25, z: 0 };
    const result = landmarkToCanvas(landmark, fakeCanvas(400, 300));
    expect(result.y).toBe(75);
  });

  it('maps a landmark at the origin to the top-right corner', () => {
    const landmark: HandLandmark = { x: 0, y: 0, z: 0 };
    const result = landmarkToCanvas(landmark, fakeCanvas(640, 480));
    expect(result).toEqual({ x: 640, y: 0 });
  });

  it('maps a landmark at (1,1) to the bottom-left corner', () => {
    const landmark: HandLandmark = { x: 1, y: 1, z: 0 };
    const result = landmarkToCanvas(landmark, fakeCanvas(640, 480));
    expect(result).toEqual({ x: 0, y: 480 });
  });

  it('maps a centered landmark to the canvas center regardless of mirroring', () => {
    const landmark: HandLandmark = { x: 0.5, y: 0.5, z: 0 };
    const result = landmarkToCanvas(landmark, fakeCanvas(400, 200));
    expect(result).toEqual({ x: 200, y: 100 });
  });
});
