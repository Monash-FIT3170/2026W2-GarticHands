import { GestureType } from './GestureTypes';
import type { HandLandmark } from '../Models/HandLandmark';
import { detectHandOnScreen } from './detectors/detectHandOnScreen';
import { pinchRatio, PinchStabilizer } from './detectors/detectPinch';
import { detectOpenPalm } from './detectors/detectOpenPalm';

export function detectGesture(
  landmarks: HandLandmark[] | undefined,
  pinchStabilizer: PinchStabilizer,
): GestureType {
  if (!detectHandOnScreen(landmarks)) {
    pinchStabilizer.reset();
    return GestureType.NO_HAND;
  }
  if (pinchStabilizer.update(pinchRatio(landmarks!))) return GestureType.PINCH;
  if (detectOpenPalm(landmarks)) return GestureType.OPEN_PALM;
  return GestureType.HAND_PRESENT;
}