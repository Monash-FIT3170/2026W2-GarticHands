// for pure helper math

// Eg...

// distance calculation
// angle calculation
// finger extension checks

import type { HandLandmark } from '../Models/HandLandmark';

export const distance = (
  a: HandLandmark,
  b: HandLandmark
): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;

  return Math.sqrt(dx * dx + dy * dy);
};