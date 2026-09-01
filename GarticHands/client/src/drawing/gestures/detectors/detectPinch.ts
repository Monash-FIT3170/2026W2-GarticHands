import type { HandLandmark } from '../../Models/HandLandmark';
import { distance } from '../GestureUtils';

// Distance threshold is normalized by palm width so the gesture survives
// the user moving closer to or further from the camera.
const PINCH_THRESHOLD = 0.4;

/**
 * @param thresholdScale Multiplier on the normalized threshold — the user's
 * gesture-sensitivity setting (`GESTURE_THRESHOLD_SCALE` in
 * `DrawingSettings.ts`). `1` (the default) is the stock behavior; `> 1`
 * makes the pinch fire with a looser grip, `< 1` requires a tighter one.
 */
export function detectPinch(landmarks: HandLandmark[], thresholdScale: number = 1): boolean {
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const palmWidth = distance(landmarks[5], landmarks[17]);

  if (palmWidth === 0) return false;

  return distance(thumbTip, indexTip) / palmWidth < PINCH_THRESHOLD * thresholdScale;
}
