import { describe, it, expect } from 'vitest';

import {
  pinchRatio,
  PinchStabilizer,
} from '../src/drawing/gestures/detectors/detectPinch';

import type { HandLandmark } from '../src/drawing/Models/HandLandmark';

function baseLandmarks(): HandLandmark[] {
  return Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }));
}

describe('pinchRatio', () => {
  it('returns the thumb/index distance relative to palm width', () => {
    const landmarks = baseLandmarks();

    landmarks[5] = { x: 0, y: 0, z: 0 };
    landmarks[17] = { x: 1, y: 0, z: 0 };

    landmarks[4] = { x: 0.5, y: 0, z: 0 };
    landmarks[8] = { x: 0.5, y: 0.1, z: 0 };

    expect(pinchRatio(landmarks)).toBeCloseTo(0.1);
  });

  it('returns a larger ratio when thumb and index are further apart', () => {
    const landmarks = baseLandmarks();

    landmarks[5] = { x: 0, y: 0, z: 0 };
    landmarks[17] = { x: 1, y: 0, z: 0 };

    landmarks[4] = { x: 0, y: 0, z: 0 };
    landmarks[8] = { x: 0.5, y: 0, z: 0 };

    expect(pinchRatio(landmarks)).toBeCloseTo(0.5);
  });

  it('scales with palm width so the ratio is distance-from-camera invariant', () => {
    const landmarks = baseLandmarks();

    landmarks[5] = { x: 0, y: 0, z: 0 };
    landmarks[17] = { x: 2, y: 0, z: 0 };

    landmarks[4] = { x: 1, y: 0, z: 0 };
    landmarks[8] = { x: 1, y: 0.1, z: 0 };

    expect(pinchRatio(landmarks)).toBeCloseTo(0.05);
  });

  it('returns null when palm width is zero', () => {
    const landmarks = baseLandmarks();

    landmarks[5] = { x: 0.3, y: 0.3, z: 0 };
    landmarks[17] = { x: 0.3, y: 0.3, z: 0 };

    landmarks[4] = { x: 0.3, y: 0.3, z: 0 };
    landmarks[8] = { x: 0.3, y: 0.3, z: 0 };

    expect(pinchRatio(landmarks)).toBeNull();
  });
});

describe('PinchStabilizer', () => {
  it('enters pinch when the ratio is below the entry threshold', () => {
    const stabilizer = new PinchStabilizer();

    expect(stabilizer.update(0.3)).toBe(true);
  });

  it('does not enter pinch at the entry threshold boundary', () => {
    const stabilizer = new PinchStabilizer();

    expect(stabilizer.update(0.35)).toBe(false);
  });

  it('stays pinching while the ratio remains below the exit threshold', () => {
    const stabilizer = new PinchStabilizer();

    expect(stabilizer.update(0.3)).toBe(true);
    expect(stabilizer.update(0.45)).toBe(true);
    expect(stabilizer.update(0.49)).toBe(true);
  });

  it('requires four consecutive frames above the exit threshold before releasing', () => {
    const stabilizer = new PinchStabilizer();

    expect(stabilizer.update(0.3)).toBe(true);

    expect(stabilizer.update(0.6)).toBe(true);
    expect(stabilizer.update(0.6)).toBe(true);
    expect(stabilizer.update(0.6)).toBe(true);
    expect(stabilizer.update(0.6)).toBe(false);
  });

  it('resets the exit streak when the ratio drops below the exit threshold', () => {
    const stabilizer = new PinchStabilizer();

    expect(stabilizer.update(0.3)).toBe(true);

    expect(stabilizer.update(0.6)).toBe(true);
    expect(stabilizer.update(0.6)).toBe(true);

    expect(stabilizer.update(0.4)).toBe(true);

    expect(stabilizer.update(0.6)).toBe(true);
    expect(stabilizer.update(0.6)).toBe(true);
    expect(stabilizer.update(0.6)).toBe(true);
    expect(stabilizer.update(0.6)).toBe(false);
  });

  it('stops pinching when the ratio is null', () => {
    const stabilizer = new PinchStabilizer();

    expect(stabilizer.update(0.3)).toBe(true);
    expect(stabilizer.update(null)).toBe(false);
  });

  it('reset clears the current pinch state', () => {
    const stabilizer = new PinchStabilizer();

    expect(stabilizer.update(0.3)).toBe(true);

    stabilizer.reset();

    expect(stabilizer.update(0.45)).toBe(false);
  });
});