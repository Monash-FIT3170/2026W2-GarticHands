import { GestureType } from './GestureTypes';
import type { HandLandmark } from '../Models/HandLandmark';
import {
  DEFAULT_GESTURE_SENSITIVITY,
  GESTURE_THRESHOLD_SCALE,
  type GestureSensitivity,
} from '../DrawingSettings';
import { detectHandOnScreen } from './detectors/detectHandOnScreen';
import { detectPinch } from './detectors/detectPinch';
import { detectOpenPalm } from './detectors/detectOpenPalm';

// Order matters. PINCH and OPEN_PALM are mutually exclusive in practice but
// noisy frames can match both, so we check the more constrained gesture
// (PINCH) first. HAND_PRESENT is the fallback when a hand is visible but
// neither specific gesture is held.
//
// Sensitivity only scales detectors that use a normalized threshold (pinch).
// detectOpenPalm is a pure pose check (tips above bases — no threshold) and
// detectHandOnScreen counts landmarks, so scaling them has no meaning.
export function detectGesture(
  landmarks: HandLandmark[] | undefined,
  sensitivity: GestureSensitivity = DEFAULT_GESTURE_SENSITIVITY,
): GestureType {
  if (!detectHandOnScreen(landmarks)) return GestureType.NO_HAND;
  if (detectPinch(landmarks, GESTURE_THRESHOLD_SCALE[sensitivity])) return GestureType.PINCH;
  if (detectOpenPalm(landmarks)) return GestureType.OPEN_PALM;
  return GestureType.HAND_PRESENT;
}
