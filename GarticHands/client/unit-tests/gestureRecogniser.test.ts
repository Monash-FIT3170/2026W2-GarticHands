import { describe, it, expect, vi, beforeEach } from 'vitest';

import { detectGesture } from '../src/drawing/gestures/GestureRecogniser';
import { GestureType } from '../src/drawing/gestures/GestureTypes';
import { detectHandOnScreen } from '../src/drawing/gestures/detectors/detectHandOnScreen';
import { PinchStabilizer } from '../src/drawing/gestures/detectors/detectPinch';
import { detectOpenPalm } from '../src/drawing/gestures/detectors/detectOpenPalm';

import type { HandLandmark } from '../src/drawing/Models/HandLandmark';

vi.mock('../src/drawing/gestures/detectors/detectHandOnScreen');
vi.mock('../src/drawing/gestures/detectors/detectOpenPalm');

function landmarksWithPinchRatio(ratio: number): HandLandmark[] {
  const landmarks = Array.from(
    { length: 21 },
    () => ({ x: 0, y: 0, z: 0 }),
  );

  landmarks[5] = { x: 0, y: 0, z: 0 };
  landmarks[17] = { x: 1, y: 0, z: 0 };

  landmarks[4] = { x: 0, y: 0, z: 0 };
  landmarks[8] = { x: ratio, y: 0, z: 0 };

  return landmarks;
}

const landmarks = landmarksWithPinchRatio(0.3);

describe('detectGesture', () => {
  let pinchStabilizer: PinchStabilizer;

  beforeEach(() => {
    vi.clearAllMocks();
    pinchStabilizer = new PinchStabilizer();
  });

  it('returns NO_HAND when no hand is on screen and resets the pinch stabilizer', () => {
    vi.mocked(detectHandOnScreen).mockReturnValue(false);

    const resetSpy = vi.spyOn(pinchStabilizer, 'reset');

    expect(detectGesture(landmarks, pinchStabilizer)).toBe(GestureType.NO_HAND);

    expect(resetSpy).toHaveBeenCalled();
    expect(detectOpenPalm).not.toHaveBeenCalled();
  });

  it('returns PINCH when the pinch ratio enters the pinch threshold', () => {
    vi.mocked(detectHandOnScreen).mockReturnValue(true);

    expect(detectGesture(landmarks, pinchStabilizer)).toBe(GestureType.PINCH);

    expect(detectOpenPalm).not.toHaveBeenCalled();
  });

  it('prioritises PINCH over OPEN_PALM when both gestures match', () => {
    vi.mocked(detectHandOnScreen).mockReturnValue(true);
    vi.mocked(detectOpenPalm).mockReturnValue(true);

    expect(detectGesture(landmarks, pinchStabilizer)).toBe(GestureType.PINCH);
  });

  it('returns OPEN_PALM when the hand is open and not pinching', () => {
    vi.mocked(detectHandOnScreen).mockReturnValue(true);

    const openPalmLandmarks = landmarksWithPinchRatio(0.6);
    vi.mocked(detectOpenPalm).mockReturnValue(true);

    expect(
      detectGesture(openPalmLandmarks, pinchStabilizer),
    ).toBe(GestureType.OPEN_PALM);
  });

  it('falls back to HAND_PRESENT when no specific gesture matches', () => {
    vi.mocked(detectHandOnScreen).mockReturnValue(true);

    const neutralLandmarks = landmarksWithPinchRatio(0.6);
    vi.mocked(detectOpenPalm).mockReturnValue(false);

    expect(
      detectGesture(neutralLandmarks, pinchStabilizer),
    ).toBe(GestureType.HAND_PRESENT);
  });
});