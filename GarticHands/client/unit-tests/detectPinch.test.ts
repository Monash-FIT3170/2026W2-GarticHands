import { describe, it, expect } from 'vitest';
import { detectPinch } from '../src/drawing/gestures/detectors/detectPinch';
import { GESTURE_THRESHOLD_SCALE } from '../src/drawing/DrawingSettings';
import type { HandLandmark } from '../src/drawing/Models/HandLandmark';

function baseLandmarks(): HandLandmark[] {
  return Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }));
}

describe('detectPinch', () => {
  it('returns true when thumb/index distance is well under the threshold', () => {
    const landmarks = baseLandmarks();
    landmarks[5] = { x: 0, y: 0, z: 0 };
    landmarks[17] = { x: 1, y: 0, z: 0 }; // palmWidth = 1
    landmarks[4] = { x: 0.5, y: 0, z: 0 }; // thumb tip
    landmarks[8] = { x: 0.5, y: 0.1, z: 0 }; // index tip, distance 0.1
    expect(detectPinch(landmarks)).toBe(true);
  });

  it('returns false when thumb and index are far apart relative to palm width', () => {
    const landmarks = baseLandmarks();
    landmarks[5] = { x: 0, y: 0, z: 0 };
    landmarks[17] = { x: 1, y: 0, z: 0 }; // palmWidth = 1
    landmarks[4] = { x: 0, y: 0, z: 0 };
    landmarks[8] = { x: 0.5, y: 0, z: 0 }; // distance 0.5, ratio 0.5 >= threshold
    expect(detectPinch(landmarks)).toBe(false);
  });

  it('returns false right at the threshold boundary (strict inequality)', () => {
    const landmarks = baseLandmarks();
    landmarks[5] = { x: 0, y: 0, z: 0 };
    landmarks[17] = { x: 1, y: 0, z: 0 }; // palmWidth = 1
    landmarks[4] = { x: 0, y: 0, z: 0 };
    landmarks[8] = { x: 0.4, y: 0, z: 0 }; // ratio exactly 0.4
    expect(detectPinch(landmarks)).toBe(false);
  });

  it('scales with palm width so the gesture is distance-from-camera invariant', () => {
    const landmarks = baseLandmarks();
    landmarks[5] = { x: 0, y: 0, z: 0 };
    landmarks[17] = { x: 2, y: 0, z: 0 }; // palmWidth = 2 (hand appears closer)
    landmarks[4] = { x: 1, y: 0, z: 0 };
    landmarks[8] = { x: 1, y: 0.1, z: 0 }; // distance 0.1, ratio 0.05 -> pinch
    expect(detectPinch(landmarks)).toBe(true);
  });

  it('returns false rather than dividing by zero when palm width is 0', () => {
    const landmarks = baseLandmarks();
    landmarks[5] = { x: 0.3, y: 0.3, z: 0 };
    landmarks[17] = { x: 0.3, y: 0.3, z: 0 }; // palmWidth = 0
    landmarks[4] = { x: 0.3, y: 0.3, z: 0 };
    landmarks[8] = { x: 0.3, y: 0.3, z: 0 };
    expect(detectPinch(landmarks)).toBe(false);
  });
});

describe('detectPinch sensitivity scaling', () => {
  /** Hand with palmWidth 1, so `ratio` IS the normalized thumb-index distance. */
  function landmarksWithRatio(ratio: number): HandLandmark[] {
    const landmarks = baseLandmarks();
    landmarks[5] = { x: 0, y: 0, z: 0 };
    landmarks[17] = { x: 1, y: 0, z: 0 }; // palmWidth = 1
    landmarks[4] = { x: 0, y: 0, z: 0 };
    landmarks[8] = { x: ratio, y: 0, z: 0 };
    return landmarks;
  }

  it('keeps the default sensitivity scale at exactly 1 (stock behavior preserved)', () => {
    expect(GESTURE_THRESHOLD_SCALE.default).toBe(1);
  });

  it('omitting the scale behaves identically to the default sensitivity scale', () => {
    for (const ratio of [0.25, 0.35, 0.4, 0.45]) {
      const landmarks = landmarksWithRatio(ratio);
      expect(detectPinch(landmarks)).toBe(detectPinch(landmarks, GESTURE_THRESHOLD_SCALE.default));
    }
  });

  it('high sensitivity accepts a looser pinch that default rejects', () => {
    // Above the stock 0.4 threshold but below the scaled 0.4 * 1.25 = 0.5.
    const landmarks = landmarksWithRatio(0.45);
    expect(detectPinch(landmarks)).toBe(false);
    expect(detectPinch(landmarks, GESTURE_THRESHOLD_SCALE.high)).toBe(true);
  });

  it('low sensitivity rejects a pinch that default accepts', () => {
    // Below the stock 0.4 threshold but above the scaled 0.4 * 0.75 = 0.3.
    const landmarks = landmarksWithRatio(0.35);
    expect(detectPinch(landmarks)).toBe(true);
    expect(detectPinch(landmarks, GESTURE_THRESHOLD_SCALE.low)).toBe(false);
  });

  it('a tight pinch still fires at every sensitivity level', () => {
    const landmarks = landmarksWithRatio(0.1);
    for (const scale of Object.values(GESTURE_THRESHOLD_SCALE)) {
      expect(detectPinch(landmarks, scale)).toBe(true);
    }
  });
});
