import { describe, it, expect } from 'vitest';
import { detectHandOnScreen } from '../src/drawing/gestures/detectors/detectHandOnScreen';
import type { HandLandmark } from '../src/drawing/Models/HandLandmark';

const makeLandmarks = (count: number): HandLandmark[] =>
  Array.from({ length: count }, () => ({ x: 0, y: 0, z: 0 }));

describe('detectHandOnScreen', () => {
  it('returns false when landmarks is undefined', () => {
    expect(detectHandOnScreen(undefined)).toBe(false);
  });

  it('returns false for an empty array', () => {
    expect(detectHandOnScreen([])).toBe(false);
  });

  it('returns false for a partial detection below 21 landmarks', () => {
    expect(detectHandOnScreen(makeLandmarks(20))).toBe(false);
  });

  it('returns true for exactly 21 landmarks', () => {
    expect(detectHandOnScreen(makeLandmarks(21))).toBe(true);
  });

  it('returns true when more than 21 landmarks are somehow present', () => {
    expect(detectHandOnScreen(makeLandmarks(25))).toBe(true);
  });
});
