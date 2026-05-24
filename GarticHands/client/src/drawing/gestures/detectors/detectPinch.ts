import type { HandLandmark } from '../../Models/HandLandmark';
import { distance } from '../GestureUtils';

// Distance threshold is normalized by palm width so the gesture survives
// the user moving closer to or further from the camera.
const PINCH_THRESHOLD = 0.4;

export function detectPinch(landmarks: HandLandmark[]): boolean {
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const palmWidth = distance(landmarks[5], landmarks[17]);

  if (palmWidth === 0) return false;

  return distance(thumbTip, indexTip) / palmWidth < PINCH_THRESHOLD;
}
