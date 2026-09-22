import type { HandLandmark } from '../../Models/HandLandmark';
import { distance } from '../GestureUtils';

// Enter pinch at a tighter ratio, exit only once it's clearly open again.
// The gap absorbs landmark jitter without needing fingers held rock-steady
// at a single threshold mid-stroke.
const ENTER_THRESHOLD = 0.35;
const EXIT_THRESHOLD = 0.5;

export function pinchRatio(landmarks: HandLandmark[]): number | null {
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const palmWidth = distance(landmarks[5], landmarks[17]);
  if (palmWidth === 0) return null;
  return distance(thumbTip, indexTip) / palmWidth;
}

export class PinchStabilizer {
  private isPinching = false;

  update(ratio: number | null): boolean {
    if (ratio === null) {
      this.isPinching = false;
      return false;
    }
    if (this.isPinching) {
      if (ratio > EXIT_THRESHOLD) this.isPinching = false;
    } else {
      if (ratio < ENTER_THRESHOLD) this.isPinching = true;
    }
    return this.isPinching;
  }

  reset(): void {
    this.isPinching = false;
  }
}