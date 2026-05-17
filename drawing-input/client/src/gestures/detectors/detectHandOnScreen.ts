import type { HandLandmark } from '../../Models/HandLandmark';

// MediaPipe always returns 21 landmarks when it detects a hand. Anything
// less means either no hand or a partial detection — treat both as absent.
const LANDMARK_COUNT = 21;

export function detectHandOnScreen(
  landmarks: HandLandmark[] | undefined,
): boolean {
  return !!landmarks && landmarks.length >= LANDMARK_COUNT;
}
