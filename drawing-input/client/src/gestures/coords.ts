import type { HandLandmark } from '../Models/HandLandmark';
import type { Point } from '../Models/Point';

// MediaPipe landmarks are normalized to [0,1] in the original (unmirrored)
// camera frame. The display canvas is flipped horizontally so the user sees
// themselves like a mirror — so we invert x here to keep drawn points sitting
// directly under the visible hand.
export function landmarkToCanvas(
  landmark: HandLandmark,
  canvas: HTMLCanvasElement,
): Point {
  return {
    x: (1 - landmark.x) * canvas.width,
    y: landmark.y * canvas.height,
  };
}
