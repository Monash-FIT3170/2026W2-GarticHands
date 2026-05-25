import type { CanvasOp } from './CanvasOps';
import type { Point } from '../../Models/Point';
import { GestureType } from '../../gestures/GestureTypes';

/**
 * Erases pixels along the open-palm cursor path.
 *
 * Improvements over a single-circle "stamp":
 *  - Interpolates between frames so fast hand movement still produces a
 *    continuous erase band (no gaps).
 *  - Uses a smooth `destination-out` stroke instead of stamped circles, which
 *    avoids the scalloped edge artifact at high speeds.
 */
export class CanvasErase implements CanvasOp {
  readonly name = 'erase';
  readonly activatedBy = GestureType.OPEN_PALM;

  private prev: Point | null = null;

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly radius: number = 18,
  ) {}

  tick(point: Point): void {
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'destination-out';
    this.ctx.lineWidth = this.radius * 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    if (this.prev) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.prev.x, this.prev.y);
      this.ctx.lineTo(point.x, point.y);
      this.ctx.stroke();
    } else {
      // First sample — single stamp to mark the start of the swipe.
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, this.radius, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();
    this.prev = point;
  }

  reset(): void {
    this.prev = null;
  }
}
