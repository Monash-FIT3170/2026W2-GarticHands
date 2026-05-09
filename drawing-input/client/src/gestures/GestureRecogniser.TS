import { GestureType } from './GestureTypes';
import type { HandLandmark } from '../Models/HandLandmark';
import { distance } from './GestureUtils';

export const detectGesture = (
  landmarks: HandLandmark[]
): (typeof GestureType)[keyof typeof GestureType] => {
  if (!landmarks || landmarks.length < 21) {
    return GestureType.NONE;
  }

  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];

  const pinchDist = distance(thumbTip, indexTip);

  // normalize by palm size (robust across distance/camera)
  const palmScale = distance(
    landmarks[5],
    landmarks[17]
  );

  const normalizedPinch =
    palmScale > 0 ? pinchDist / palmScale : 1;

  if (normalizedPinch < 0.4) {
    return GestureType.PINCH;
  }

  // OPEN PALM heuristic
  const fingerTips = [8, 12, 16, 20];
  const fingerBases = [5, 9, 13, 17];

  const openPalm = fingerTips.every((tip, i) => {
    return (
      landmarks[tip].y <
      landmarks[fingerBases[i]].y
    );
  });

  if (openPalm) {
    return GestureType.OPEN_PALM;
  }

  return GestureType.NONE;
};