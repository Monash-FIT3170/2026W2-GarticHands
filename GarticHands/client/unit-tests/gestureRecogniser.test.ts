import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectGesture } from '../src/drawing/gestures/GestureRecogniser';
import { GestureType } from '../src/drawing/gestures/GestureTypes';
import { detectHandOnScreen } from '../src/drawing/gestures/detectors/detectHandOnScreen';
import { detectPinch } from '../src/drawing/gestures/detectors/detectPinch';
import { detectOpenPalm } from '../src/drawing/gestures/detectors/detectOpenPalm';
import type { HandLandmark } from '../src/drawing/Models/HandLandmark';

vi.mock('../src/drawing/gestures/detectors/detectHandOnScreen');
vi.mock('../src/drawing/gestures/detectors/detectPinch');
vi.mock('../src/drawing/gestures/detectors/detectOpenPalm');

const landmarks = [] as unknown as HandLandmark[];

describe('detectGesture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns NO_HAND when no hand is on screen, without checking other gestures', () => {
    vi.mocked(detectHandOnScreen).mockReturnValue(false);

    expect(detectGesture(landmarks)).toBe(GestureType.NO_HAND);
    expect(detectPinch).not.toHaveBeenCalled();
    expect(detectOpenPalm).not.toHaveBeenCalled();
  });

  it('returns PINCH when a pinch is detected, without checking open palm', () => {
    vi.mocked(detectHandOnScreen).mockReturnValue(true);
    vi.mocked(detectPinch).mockReturnValue(true);

    expect(detectGesture(landmarks)).toBe(GestureType.PINCH);
    expect(detectOpenPalm).not.toHaveBeenCalled();
  });

  it('prioritises PINCH over OPEN_PALM when a noisy frame matches both', () => {
    vi.mocked(detectHandOnScreen).mockReturnValue(true);
    vi.mocked(detectPinch).mockReturnValue(true);
    vi.mocked(detectOpenPalm).mockReturnValue(true);

    expect(detectGesture(landmarks)).toBe(GestureType.PINCH);
  });

  it('returns OPEN_PALM when hand is present, not pinching, and palm is open', () => {
    vi.mocked(detectHandOnScreen).mockReturnValue(true);
    vi.mocked(detectPinch).mockReturnValue(false);
    vi.mocked(detectOpenPalm).mockReturnValue(true);

    expect(detectGesture(landmarks)).toBe(GestureType.OPEN_PALM);
  });

  it('falls back to HAND_PRESENT when hand is on screen but no specific gesture matches', () => {
    vi.mocked(detectHandOnScreen).mockReturnValue(true);
    vi.mocked(detectPinch).mockReturnValue(false);
    vi.mocked(detectOpenPalm).mockReturnValue(false);

    expect(detectGesture(landmarks)).toBe(GestureType.HAND_PRESENT);
  });
});
