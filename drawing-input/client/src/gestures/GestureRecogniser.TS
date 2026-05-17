import { GestureType } from './GestureTypes';
import type { HandLandmark } from '../Models/HandLandmark';
import { detectHandOnScreen } from './detectors/detectHandOnScreen';
import { detectPinch } from './detectors/detectPinch';
import { detectOpenPalm } from './detectors/detectOpenPalm';

// Order matters. PINCH and OPEN_PALM are mutually exclusive in practice but
// noisy frames can match both, so we check the more constrained gesture
// (PINCH) first. HAND_PRESENT is the fallback when a hand is visible but
// neither specific gesture is held.
export function detectGesture(
  landmarks: HandLandmark[] | undefined,
): GestureType {
  if (!detectHandOnScreen(landmarks)) return GestureType.NO_HAND;
  if (detectPinch(landmarks!)) return GestureType.PINCH;
  if (detectOpenPalm(landmarks!)) return GestureType.OPEN_PALM;
  return GestureType.HAND_PRESENT;
}
