import type { CanvasOp } from './CanvasOps';
import type { Point } from '../../Models/Point';
import { GestureType } from '../../gestures/GestureTypes';
import { OneEuroFilter } from '1eurofilter';

/**
 * Draws a continuous stroke while the user is pinching.
 *
 * Smoothing pipeline (per point, in order):
 *  1. One Euro filter — adaptively filters jitter while preserving responsiveness.
 *  2. Midpoint-quadratic interpolation — turns the polyline into a smooth curve
 *     by drawing the segment from the previous mid-point to the current mid-point
 *     using the previous landmark as the Bezier control.
 *
 * Together these produce smoother strokes without changing the input pipeline.
 */
export class CanvasDraw implements CanvasOp {
  readonly name = 'draw';
  readonly activatedBy = GestureType.PINCH;

  private static readonly FREQUENCY = 60;
  private static readonly MIN_CUTOFF = 0.5;
  private static readonly BETA = 0.005;
  private static readonly D_CUTOFF = 1.0;

  private readonly xFilter: OneEuroFilter;
  private readonly yFilter: OneEuroFilter;

  private smoothed: Point | null = null;
  private prevSmoothed: Point | null = null;
  private prevMid: Point | null = null;

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly color: string = 'black',
    private readonly lineWidth: number = 4,
  ) {
    this.xFilter = new OneEuroFilter(
      CanvasDraw.FREQUENCY,
      CanvasDraw.MIN_CUTOFF,
      CanvasDraw.BETA,
      CanvasDraw.D_CUTOFF,
    );

    this.yFilter = new OneEuroFilter(
      CanvasDraw.FREQUENCY,
      CanvasDraw.MIN_CUTOFF,
      CanvasDraw.BETA,
      CanvasDraw.D_CUTOFF,
    );
  }

  tick(point: Point): void {
    // 1. One Euro filter — filter x and y independently.
    const timestamp = performance.now() / 1000;
    this.smoothed = {
      x: this.xFilter.filter(point.x, timestamp),
      y: this.yFilter.filter(point.y, timestamp),
    };

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
      this.ctx.quadraticCurveTo(this.prevSmoothed.x, this.prevSmoothed.y, mid.x, mid.y);
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
    this.xFilter.reset();
    this.yFilter.reset();
    this.smoothed = null;
    this.prevSmoothed = null;
    this.prevMid = null;
  }
}