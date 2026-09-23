import type { HandLandmark } from '../../Models/HandLandmark';
import { distance3D } from '../GestureUtils';

// Enter pinch at a tighter ratio, exit only once it's clearly open again.
// The gap absorbs landmark jitter without needing fingers held rock-steady
// at a single threshold mid-stroke.
const ENTER_THRESHOLD = 0.35;
const EXIT_THRESHOLD = 0.5;

// Consecutive frames the exit condition must hold before we actually end
// the pinch. Landmark accuracy degrades near the camera frame edges, which
// can spike pinchRatio past EXIT_THRESHOLD for a frame or two even with
// fingers still closed — this absorbs that without adding entry latency.
const EXIT_STREAK_REQUIRED = 4;

// Both distances use the 3D variant so the ratio stays consistent when the
// hand rotates relative to the camera — a 2D-only span foreshortens under
// rotation and would otherwise shift the ratio for reasons unrelated to
// finger position.
export function pinchRatio(landmarks: HandLandmark[]): number | null {
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const palmWidth = distance3D(landmarks[5], landmarks[17]);
  if (palmWidth === 0) return null;
  return distance3D(thumbTip, indexTip) / palmWidth;
}

export class PinchStabilizer {
  private isPinching = false;
  private exitStreak = 0;

  update(ratio: number | null): boolean {
    if (ratio === null) {
      this.isPinching = false;
      this.exitStreak = 0;
      return false;
    }

    if (this.isPinching) {
      if (ratio > EXIT_THRESHOLD) {
        this.exitStreak++;
        if (this.exitStreak >= EXIT_STREAK_REQUIRED) {
          this.isPinching = false;
          this.exitStreak = 0;
        }
      } else {
        // Ratio dipped back under threshold — noise, not a real release.
        this.exitStreak = 0;
      }
    } else {
      this.exitStreak = 0;
      if (ratio < ENTER_THRESHOLD) this.isPinching = true;
    }

    return this.isPinching;
  }

  reset(): void {
    this.isPinching = false;
    this.exitStreak = 0;
  }
}