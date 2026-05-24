import type { CanvasOp } from './CanvasOps';
import type { Point } from '../../Models/Point';
import { GestureType } from '../../gestures/GestureTypes';

export class CanvasErase implements CanvasOp {
  readonly name = 'erase';
  readonly activatedBy = GestureType.OPEN_PALM;

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly radius: number = 12,
  ) {}

  tick(point: Point): void {
    // `destination-out` removes existing pixels rather than painting new
    // ones — the canonical canvas eraser technique.
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'destination-out';
    this.ctx.beginPath();
    this.ctx.arc(point.x, point.y, this.radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  reset(): void {}
}
