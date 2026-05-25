import {
  useEffect,
  useImperativeHandle,
  useRef,
  type Ref,
} from 'react';

import type { HandLandmark } from '../Models/HandLandmark';
import { GestureType } from '../gestures/GestureTypes';
import { landmarkToCanvas } from '../gestures/coords';
import { useDrawingContext } from '../DrawingContext';

import type { CanvasOp } from './CanvasOperations/CanvasOps';
import { CanvasDraw } from './CanvasOperations/CanvasDraw';
import { CanvasErase } from './CanvasOperations/CanvasErase';
import { CanvasLocation } from './CanvasOperations/CanvasLocation';

export interface CanvasHandle {
  onFrame: (
    landmarks: HandLandmark[] | null,
    gesture: GestureType,
  ) => void;
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
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const { registerDrawCanvasElement } = useDrawingContext();

  // Publish the draw-canvas DOM node so the recorder can sample it per-frame.
  useEffect(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    return registerDrawCanvasElement(canvas);
  }, [registerDrawCanvasElement]);

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
  useEffect(() => {
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

        const next =
          state.ops.find(op => op.activatedBy === gesture) ?? null;

        // Gesture transition — clear any in-progress state on the outgoing op
        // so e.g. a half-finished stroke doesn't reconnect to the next stroke.
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
        return drawCanvasRef.current?.toDataURL('image/png') ?? null;
      },
    }),
    [],
  );

  const wrapperClass =
    className ??
    'relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-white border border-white/30 shadow-inner';

  return (
    <div className={wrapperClass}>
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
