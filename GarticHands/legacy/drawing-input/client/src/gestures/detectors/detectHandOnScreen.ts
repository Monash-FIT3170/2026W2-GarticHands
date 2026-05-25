import type { HandLandmark } from '../../Models/HandLandmark';

// MediaPipe always returns 21 landmarks when it detects a hand. Anything
// less means either no hand or a partial detection — treat both as absent.
const LANDMARK_COUNT = 21;

// Type predicate so callers can use this as a TS guard — after a truthy
// return, `landmarks` is narrowed to HandLandmark[] without needing `!`.
export function detectHandOnScreen(
  landmarks: HandLandmark[] | undefined,
): landmarks is HandLandmark[] {
  return !!landmarks && landmarks.length >= LANDMARK_COUNT;
}
