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

interface CanvasProps {
  width?: number;
  height?: number;
  ref?: Ref<CanvasHandle>;
  /** Color for the draw-stroke op. Default black. Switch to e.g. 'white' when
   *  overlaying on the camera feed for contrast. Changing this preserves the
   *  existing canvas pixels — only future strokes adopt the new color. */
  strokeColor?: string;
  /** Wrapper class override. When omitted, the default rounded white panel is used.
   *  Pass an absolute-positioned, transparent class set to overlay on the camera. */
  className?: string;
}

// MediaPipe landmark index for the tip of the index finger — the single
// "cursor point" used across all operations for consistency.
const INDEX_FINGERTIP = 8;

const Canvas = ({
  width = 640,
  height = 480,
  ref,
  strokeColor = 'black',
  className,
}: CanvasProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const { registerDrawCanvasElement } = useDrawingContext();

  // Publish the draw-canvas DOM node so the recorder can sample it per-frame.
  useLayoutEffect(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    return registerDrawCanvasElement(canvas);
  }, [registerDrawCanvasElement]);

  // Keep each canvas's backing-store pixel size in lockstep with its actual
  // rendered CSS box. The backing store used to be a hardcoded 640x480 (4:3)
  // regardless of the box it rendered into — depending on the surrounding
  // grid/flex layout, that box can end up a different aspect ratio, and the
  // browser then stretches the raster non-uniformly (different x/y scale
  // factors) to force-fill it. That distorts every shape drawn (circles
  // become ellipses, stroke width becomes direction-dependent) and throws
  // off the 1:1 assumption between a canvas pixel and a screen pixel that
  // `landmarkToCanvas` relies on. Measuring the real rendered box and
  // resizing the backing store to match removes the stretch at the source,
  // independent of whatever layout ends up surrounding this component.
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

  // Recreate ops when strokeColor changes — preserves the already-drawn pixels
  // (those live on the canvas element, not in the op instances) while routing
  // future strokes through the new-colored CanvasDraw.
  useLayoutEffect(() => {
    const drawCtx = drawCanvasRef.current?.getContext('2d');
    const overlayCtx = overlayCanvasRef.current?.getContext('2d');
    if (!drawCtx || !overlayCtx) return;

    stateRef.current = {
      ops: [new CanvasDraw(drawCtx, strokeColor), new CanvasErase(drawCtx)],
      cursor: new CanvasLocation(overlayCtx),
      active: null,
    };
  }, [strokeColor]);

  useImperativeHandle(
    ref,
    () => ({
      onFrame(landmarks, gesture) {
        const state = stateRef.current;
        const drawCanvas = drawCanvasRef.current;
        if (!state || !drawCanvas) return;

        const next = state.ops.find((op) => op.activatedBy === gesture) ?? null;

        // Gesture transition — clear any in-progress state on the outgoing op
        // so e.g. a half-finished stroke doesn't reconnect to the next stroke.
        if (next !== state.active) {
          state.active?.reset();
          state.active = next;
        }

        if (landmarks) {
          const point = landmarkToCanvas(landmarks[INDEX_FINGERTIP], drawCanvas);
          state.cursor.render(point, gesture);
          next?.tick(point);
        } else {
          state.cursor.clear();
        }
      },
      getImage() {
        // Composite onto a white background before exporting so the submitted
        // PNG is always strokes-on-white — never a transparent canvas that
        // renders as a black box on dark themes (and never white-on-white when
        // the visible canvas used white strokes for camera overlay).
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
