import type { CanvasOp } from './CanvasOps';
import type { Point } from '../../Models/Point';
import { GestureType } from '../../gestures/GestureTypes';

export class CanvasDraw implements CanvasOp {
  readonly name = 'draw';
  readonly activatedBy = GestureType.PINCH;

  private prevPoint: Point | null = null;

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly color: string = 'black',
    private readonly lineWidth: number = 3,
  ) {}

  tick(point: Point): void {
    if (this.prevPoint) {
      this.ctx.strokeStyle = this.color;
      this.ctx.lineWidth = this.lineWidth;
      this.ctx.lineCap = 'round';
      this.ctx.beginPath();
      this.ctx.moveTo(this.prevPoint.x, this.prevPoint.y);
      this.ctx.lineTo(point.x, point.y);
      this.ctx.stroke();
    }
    this.prevPoint = point;
  }

  reset(): void {
    this.prevPoint = null;
  }
}
