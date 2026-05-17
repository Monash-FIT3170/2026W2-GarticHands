import { GestureType } from '../../gestures/GestureTypes';
import type { Point } from '../../Models/Point';

// Contract every canvas operation must satisfy. The coordinator routes the
// current hand position to whichever op's `activatedBy` matches the current
// detected gesture, and calls `reset()` on the outgoing op when the gesture
// changes so in-progress state (like an open stroke) is cleared.
export interface CanvasOp {
  readonly name: string;
  readonly activatedBy: GestureType;
  tick(point: Point): void;
  reset(): void;
}
