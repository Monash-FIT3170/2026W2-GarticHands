import type { Point } from '../../Models/Point';
import { GestureType } from '../../gestures/GestureTypes';
import type { DrawingTool } from '../Canvas';

// Cursor renderer for the overlay canvas. Intentionally NOT a CanvasOp:
// it runs every frame a hand is on screen and swaps its icon based on the
// current tool and gesture, so the user has continuous feedback about
// which mode they're in. Lives on its own overlay context so the cursor
// never gets baked into the artwork.
export class CanvasLocation {
  readonly name = 'location';

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly iconSize: number = 28,
  ) {}

  render(point: Point, gesture: GestureType, tool: DrawingTool): void {
    this.clear();

    switch (gesture) {
      case GestureType.PINCH:
        this.drawIcon(point, tool === 'erase' ? '🧽' : '✏️');
        return;
      case GestureType.HAND_PRESENT:
        this.drawPointer(point);
        return;
    }
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  private drawPointer(p: Point): void {
    this.ctx.fillStyle = 'rgba(0, 120, 255, 0.6)';
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawIcon(p: Point, glyph: string): void {
    this.ctx.font = `${this.iconSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(glyph, p.x, p.y);
  }
}