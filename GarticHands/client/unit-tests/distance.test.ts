import { describe, it, expect } from 'vitest';
import { distance } from '../src/drawing/gestures/GestureUtils';
import type { HandLandmark } from '../src/drawing/Models/HandLandmark';

const lm = (x: number, y: number, z = 0): HandLandmark => ({ x, y, z });

describe('distance', () => {
  it('returns 0 for two identical points', () => {
    expect(distance(lm(0.5, 0.5), lm(0.5, 0.5))).toBe(0);
  });

  it('computes straight-line distance along the x axis', () => {
    expect(distance(lm(0, 0), lm(3, 0))).toBe(3);
  });

  it('computes straight-line distance along the y axis', () => {
    expect(distance(lm(0, 0), lm(0, 4))).toBe(4);
  });

  it('computes Euclidean distance for a 3-4-5 triangle', () => {
    expect(distance(lm(0, 0), lm(3, 4))).toBe(5);
  });

  it('is symmetric regardless of argument order', () => {
    const a = lm(0.1, 0.9);
    const b = lm(0.8, 0.2);
    expect(distance(a, b)).toBeCloseTo(distance(b, a));
  });

  it('ignores the z coordinate', () => {
    expect(distance(lm(0, 0, 100), lm(3, 4, -50))).toBe(5);
  });
});
