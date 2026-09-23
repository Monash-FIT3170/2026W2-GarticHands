// for pure helper math

// Eg...

// distance calculation
// angle calculation
// finger extension checks

import type { HandLandmark } from '../Models/HandLandmark';

export const distance = (a: HandLandmark, b: HandLandmark): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;

  return Math.sqrt(dx * dx + dy * dy);
};

// 3D variant — use where hand rotation/tilt relative to the camera could
// foreshorten a 2D-projected span (e.g. palm width during a twist). z from
// MediaPipe is a rough depth estimate relative to the wrist, noisier than
// x/y, but still meaningfully reduces foreshortening error versus ignoring
// depth entirely.
export const distance3D = (a: HandLandmark, b: HandLandmark): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};