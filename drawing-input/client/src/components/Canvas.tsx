import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';

import type { HandLandmark } from '../Models/HandLandmark';
import { GestureType } from '../gestures/GestureTypes';
import { landmarkToCanvas } from '../gestures/coords';

import type { CanvasOp } from './CanvasOperations/CanvasOps';
import { CanvasDraw } from './CanvasOperations/CanvasDraw';
import { CanvasErase } from './CanvasOperations/CanvasErase';
import { CanvasLocation } from './CanvasOperations/CanvasLocation';

export interface CanvasHandle {
  onFrame: (
    landmarks: HandLandmark[] | null,
    gesture: GestureType,
  ) => void;
}

interface CanvasProps {
  width?: number;
  height?: number;
}

// MediaPipe landmark index for the tip of the index finger — the single
// "cursor point" used across all operations for consistency.
const INDEX_FINGERTIP = 8;

const Canvas = forwardRef<CanvasHandle, CanvasProps>(
  ({ width = 640, height = 480 }, ref) => {
    const drawCanvasRef = useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

    // Ops, cursor, and the currently-routed op live in a ref so the
    // imperative onFrame handler can mutate them without re-renders.
    const stateRef = useRef<{
      ops: CanvasOp[];
      cursor: CanvasLocation;
      active: CanvasOp | null;
    } | null>(null);

    useEffect(() => {
      const drawCtx = drawCanvasRef.current?.getContext('2d');
      const overlayCtx = overlayCanvasRef.current?.getContext('2d');
      if (!drawCtx || !overlayCtx) return;

      stateRef.current = {
        ops: [new CanvasDraw(drawCtx), new CanvasErase(drawCtx)],
        cursor: new CanvasLocation(overlayCtx),
        active: null,
      };
    }, []);

    useImperativeHandle(ref, () => ({
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
    }));

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          alignItems: 'center',
        }}
      >
        <h2>Canvas</h2>

        <div
          style={{
            position: 'relative',
            width,
            height,
          }}
        >
          <canvas
            ref={drawCanvasRef}
            width={width}
            height={height}
            style={{
              position: 'absolute',
              inset: 0,
              border: '2px solid gray',
              background: 'white',
            }}
          />
          <canvas
            ref={overlayCanvasRef}
            width={width}
            height={height}
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
    );
  },
);

export default Canvas;
