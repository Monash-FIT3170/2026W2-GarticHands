import { createContext, useCallback, useRef, useContext, type ReactNode } from 'react';
import type { CanvasHandle } from './components/Canvas';
import type { HandLandmark } from './Models/HandLandmark';
import type { GestureType } from './gestures/GestureTypes';

interface DrawingContextValue {
  /** Camera input pushes a frame here. Internal — `<DrawingCameraInput>` calls it. */
  pushFrame: (landmarks: HandLandmark[] | null, gesture: GestureType) => void;
  /**
   * Canvas registers its imperative handle. Multiple canvases may register; each
   * receives the same frames. Returns an unregister function.
   *
   * The **first** canvas registered is the "primary" — `getDrawingImage` returns
   * its image. Order matters: mount the canvas you want to submit first.
   */
  registerCanvas: (handle: CanvasHandle) => () => void;
  /** Snapshot of the primary canvas as PNG data URL, or null if none mounted. */
  getDrawingImage: () => string | null;
  /**
   * HandTracking registers its on-screen canvas element so callers can composite
   * the camera feed (with landmark overlay) into a recording.
   */
  registerCameraCanvas: (canvas: HTMLCanvasElement) => () => void;
  /** Live reference to the most recently mounted camera canvas (or null). */
  getCameraCanvas: () => HTMLCanvasElement | null;
  /** Live reference to the primary drawing canvas's DOM element (or null). */
  getPrimaryDrawCanvas: () => HTMLCanvasElement | null;
  /**
   * Internal — `<Canvas>` registers its underlying DOM element so the recorder
   * can composite live pixels (handles only expose `getImage()`, which is too
   * slow per-frame).
   */
  registerDrawCanvasElement: (canvas: HTMLCanvasElement) => () => void;
}

const DrawingContext = createContext<DrawingContextValue | null>(null);

interface DrawingProviderProps {
  children: ReactNode;
}

/**
 * Wires hand-tracking frames to one or more canvases. All canvases inside the
 * provider receive the same gesture frames, so they draw in lockstep — useful
 * for showing the same strokes in two places at once (e.g. on the camera feed
 * and on a separate white canvas).
 *
 * Also exposes the camera-canvas DOM element so the recorder can composite the
 * camera feed into the saved video.
 */
export function DrawingProvider({ children }: DrawingProviderProps) {
  const canvasesRef = useRef<CanvasHandle[]>([]);
  const cameraCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawCanvasElementsRef = useRef<HTMLCanvasElement[]>([]);

  const pushFrame = useCallback((landmarks: HandLandmark[] | null, gesture: GestureType) => {
    for (const handle of canvasesRef.current) {
      handle.onFrame(landmarks, gesture);
    }
  }, []);

  const registerCanvas = useCallback((handle: CanvasHandle) => {
    canvasesRef.current.push(handle);
    return () => {
      canvasesRef.current = canvasesRef.current.filter((h) => h !== handle);
    };
  }, []);

  const getDrawingImage = useCallback(() => {
    return canvasesRef.current[0]?.getImage() ?? null;
  }, []);

  const registerCameraCanvas = useCallback((canvas: HTMLCanvasElement) => {
    cameraCanvasRef.current = canvas;
    return () => {
      if (cameraCanvasRef.current === canvas) cameraCanvasRef.current = null;
    };
  }, []);

  const getCameraCanvas = useCallback(() => cameraCanvasRef.current, []);

  const registerDrawCanvasElement = useCallback((canvas: HTMLCanvasElement) => {
    drawCanvasElementsRef.current.push(canvas);
    return () => {
      drawCanvasElementsRef.current = drawCanvasElementsRef.current.filter((c) => c !== canvas);
    };
  }, []);

  const getPrimaryDrawCanvas = useCallback(() => {
    return drawCanvasElementsRef.current[0] ?? null;
  }, []);

  return (
    <DrawingContext.Provider
      value={{
        pushFrame,
        registerCanvas,
        getDrawingImage,
        registerCameraCanvas,
        getCameraCanvas,
        getPrimaryDrawCanvas,
        registerDrawCanvasElement,
      }}
    >
      {children}
    </DrawingContext.Provider>
  );
}

/** Internal hook used by drawing components. */
export function useDrawingContext(): DrawingContextValue {
  const ctx = useContext(DrawingContext);
  if (!ctx) {
    throw new Error(
      'DrawingCameraInput / DrawingCameraCanvas must be wrapped in <DrawingProvider>.',
    );
  }
  return ctx;
}

/**
 * Public hook for pages — grab the current canvas snapshot when submitting.
 *
 * ```tsx
 * const { getDrawingImage } = useDrawing()
 * const dataUrl = getDrawingImage()
 * ```
 */
export function useDrawing() {
  const { getDrawingImage, getCameraCanvas, getPrimaryDrawCanvas } = useDrawingContext();
  return { getDrawingImage, getCameraCanvas, getPrimaryDrawCanvas };
}
