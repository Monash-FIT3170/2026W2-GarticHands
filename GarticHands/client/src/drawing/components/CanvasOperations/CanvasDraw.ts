import type { CanvasOp } from './CanvasOps';
import type { Point } from '../../Models/Point';
import { GestureType } from '../../gestures/GestureTypes';

/**
 * Draws a continuous stroke while the user is pinching.
 *
 * Smoothing pipeline (per point, in order):
 *  1. Exponential moving average — filters jittery landmark noise.
 *  2. Midpoint-quadratic interpolation — turns the polyline into a smooth curve
 *     by drawing the segment from the previous mid-point to the current mid-point
 *     using the previous landmark as the Bezier control.
 *
 * Together these produce noticeably smoother strokes than a raw `lineTo` chain
 * without changing the input pipeline.
 */
export class CanvasDraw implements CanvasOp {
  readonly name = 'draw';
  readonly activatedBy = GestureType.PINCH;

  /** Higher = follows the cursor faster, lower = more smoothing. 0.5 is a balance. */
  private static readonly EMA_ALPHA = 0.5;

  private smoothed: Point | null = null;
  private prevSmoothed: Point | null = null;
  private prevMid: Point | null = null;

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly color: string = 'black',
    private readonly lineWidth: number = 4,
  ) {}

  tick(point: Point): void {
    // 1. EMA — blend the new sample with the running smoothed point.
    const a = CanvasDraw.EMA_ALPHA;
    this.smoothed = this.smoothed
      ? {
          x: a * point.x + (1 - a) * this.smoothed.x,
          y: a * point.y + (1 - a) * this.smoothed.y,
        }
      : point;

    // 2. Need at least two smoothed points before we can draw a curve.
    if (!this.prevSmoothed) {
      this.prevSmoothed = this.smoothed;
      return;
    }

    const mid: Point = {
      x: (this.prevSmoothed.x + this.smoothed.x) / 2,
      y: (this.prevSmoothed.y + this.smoothed.y) / 2,
    };

    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.beginPath();

    if (this.prevMid) {
      // From the previous mid-point, curve through the previous landmark to the new mid-point.
      this.ctx.moveTo(this.prevMid.x, this.prevMid.y);
      this.ctx.quadraticCurveTo(
        this.prevSmoothed.x,
        this.prevSmoothed.y,
        mid.x,
        mid.y,
      );
    } else {
      // First segment — straight line into the first mid-point.
      this.ctx.moveTo(this.prevSmoothed.x, this.prevSmoothed.y);
      this.ctx.lineTo(mid.x, mid.y);
    }

    this.ctx.stroke();

    this.prevSmoothed = this.smoothed;
    this.prevMid = mid;
  }

  reset(): void {
    this.smoothed = null;
    this.prevSmoothed = null;
    this.prevMid = null;
  }
}
