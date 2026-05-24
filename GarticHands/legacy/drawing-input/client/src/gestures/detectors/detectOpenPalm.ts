import type { HandLandmark } from '../../Models/HandLandmark';

// All four non-thumb fingertips must be higher (lower y, since y grows
// downward in image space) than their bases — meaning the fingers are
// extended upward, which is the open palm pose.
const FINGER_TIPS = [8, 12, 16, 20];
const FINGER_BASES = [5, 9, 13, 17];

export function detectOpenPalm(landmarks: HandLandmark[]): boolean {
  return FINGER_TIPS.every(
    (tip, i) => landmarks[tip].y < landmarks[FINGER_BASES[i]].y,
  );
}
