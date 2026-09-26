import { useImperativeHandle, useLayoutEffect, useRef, type Ref } from 'react';

import type { HandLandmark } from '../Models/HandLandmark';
import { GestureType } from '../gestures/GestureTypes';
import { landmarkToCanvas } from '../gestures/coords';
import { useDrawingContext } from '../DrawingContext';

import type { CanvasOp } from './CanvasOperations/CanvasOps';
import { CanvasDraw } from './CanvasOperations/CanvasDraw';
import { CanvasErase } from './CanvasOperations/CanvasErase';
import { CanvasLocation } from './CanvasOperations/CanvasLocation';

export interface CanvasHandle {
  onFrame: (landmarks: HandLandmark[] | null, gesture: GestureType) => void;
  /** Returns the draw canvas as a PNG data URL, or null if the canvas is not yet mounted. */
  getImage: () => string | null;
}

export type DrawingTool = 'draw' | 'erase';

interface CanvasProps {
  width?: number;
  height?: number;
  ref?: Ref<CanvasHandle>;
  /** Color for the draw-stroke op. Default black. */
  strokeColor?: string;
  /** Thickness of the drawing stroke in pixels. Default 4. */
  strokeWidth?: number;
  /** Active drawing tool. Default draw. */
  tool?: DrawingTool;
  /** Eraser radius in pixels. Default 18. */
  eraserSize?: number;
  /** Wrapper class override. When omitted, the default rounded white panel is used.
   *  Pass an absolute-positioned, transparent class set to overlay on the camera. */
  className?: string;
}

const INDEX_FINGERTIP = 8;

const Canvas = ({
  width = 640,
  height = 480,
  ref,
  strokeColor = 'black',
  strokeWidth = 4,
  tool = 'draw',
  eraserSize = 18,
  className,
}: CanvasProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const { registerDrawCanvasElement } = useDrawingContext();

  const toolRef = useRef<DrawingTool>(tool);
  toolRef.current = tool;

  // Publish the draw-canvas DOM node so the recorder can sample it per-frame.
  useLayoutEffect(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    return registerDrawCanvasElement(canvas);
  }, [registerDrawCanvasElement]);

  // Keep each canvas's backing-store pixel size in lockstep with its actual
  // rendered CSS box.
  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const drawCanvas = drawCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!wrapper || !drawCanvas || !overlayCanvas) return;

    const resize = () => {
      const rect = wrapper.getBoundingClientRect();
      const nextWidth = Math.max(1, Math.round(rect.width));
      const nextHeight = Math.max(1, Math.round(rect.height));

      // Setting canvas.width/height clears its pixels, so preserve whatever
      // is already drawn by snapshotting it onto a scratch canvas first and
      // drawing that back scaled into the newly-sized backing store.
      for (const canvas of [drawCanvas, overlayCanvas]) {
        if (canvas.width === nextWidth && canvas.height === nextHeight) continue;

        if (canvas.width > 0 && canvas.height > 0) {
          const snapshot = document.createElement('canvas');
          snapshot.width = canvas.width;
          snapshot.height = canvas.height;
          snapshot.getContext('2d')?.drawImage(canvas, 0, 0);

          canvas.width = nextWidth;
          canvas.height = nextHeight;

          canvas
            .getContext('2d')
            ?.drawImage(
              snapshot,
              0,
              0,
              snapshot.width,
              snapshot.height,
              0,
              0,
              nextWidth,
              nextHeight,
            );
        } else {
          canvas.width = nextWidth;
          canvas.height = nextHeight;
        }
      }
    };

    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  // Ops, cursor, and the currently-routed op live in a ref so the
  // imperative onFrame handler can mutate them without re-renders.
  const stateRef = useRef<{
    ops: CanvasOp[];
    cursor: CanvasLocation;
    active: CanvasOp | null;
  } | null>(null);

  // Recreate the operations when drawing or eraser settings change.
  // Existing pixels are preserved because they live on the canvas element.
  // Only future actions use the new settings.
  useLayoutEffect(() => {
    const drawCtx = drawCanvasRef.current?.getContext('2d');
    const overlayCtx = overlayCanvasRef.current?.getContext('2d');
    if (!drawCtx || !overlayCtx) return;

    stateRef.current = {
      ops: [
        new CanvasDraw(drawCtx, strokeColor, strokeWidth),
        new CanvasErase(drawCtx, eraserSize),
      ],
      cursor: new CanvasLocation(overlayCtx),
      active: null,
    };
  }, [strokeColor, strokeWidth, eraserSize]);

  useImperativeHandle(
    ref,
    () => ({
      onFrame(landmarks, gesture) {
        const state = stateRef.current;
        const drawCanvas = drawCanvasRef.current;
        if (!state || !drawCanvas) return;

        // Only pinch performs an action. The latest selected tool determines
        // whether that pinch draws or erases.
        const next =
          gesture === GestureType.PINCH
            ? state.ops.find((op) => op.name === toolRef.current) ?? null
            : null;

        // Gesture/tool transition — clear any in-progress state on the
        // outgoing op so a new action doesn't reconnect to the previous one.
        if (next !== state.active) {
          state.active?.reset();
          state.active = next;
        }

        if (landmarks) {
          const point = landmarkToCanvas(
            landmarks[INDEX_FINGERTIP],
            drawCanvas,
          );
          state.cursor.render(point, gesture);
          next?.tick(point);
        } else {
          state.cursor.clear();
        }
      },

      getImage() {
        // Composite onto a white background before exporting so the submitted
        // PNG is always strokes-on-white.
        const src = drawCanvasRef.current;
        if (!src) return null;

        const composite = document.createElement('canvas');
        composite.width = src.width;
        composite.height = src.height;

        const ctx = composite.getContext('2d');
        if (!ctx) return null;

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, composite.width, composite.height);
        ctx.drawImage(src, 0, 0);

        return composite.toDataURL('image/png');
      },
    }),
    [],
  );

  const wrapperClass =
    className ??
    'relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-[var(--surface)] border border-[var(--surface-border)] shadow-inner';

  return (
    <div ref={wrapperRef} className={wrapperClass}>
      <canvas
        ref={drawCanvasRef}
        width={width}
        height={height}
        className="absolute inset-0 w-full h-full"
      />
      <canvas
        ref={overlayCanvasRef}
        width={width}
        height={height}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>
  );
};

export default Canvas;