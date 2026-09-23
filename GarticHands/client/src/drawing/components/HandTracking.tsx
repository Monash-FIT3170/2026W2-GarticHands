import { useEffect, useRef } from 'react';
import { useHandTracking } from '../hooks/useHandTracking';
import { useDrawingContext } from '../DrawingContext';
import type { GestureType as GestureTypeValue } from '../gestures/GestureTypes';
import type { HandLandmark } from '../Models/HandLandmark';

interface HandTrackingProps {
  onFrame?: (landmarks: HandLandmark[] | null, gesture: GestureTypeValue) => void;
}

/**
 * Webcam preview with overlaid landmark skeleton. No header text or chrome —
 * status pills float over the bottom of the canvas so it slots into any layout.
 *
 * Also publishes its canvas DOM element to the surrounding `<DrawingProvider>`
 * so the recorder hook can composite the camera feed into saved videos.
 */
export default function HandTracking({ onFrame }: HandTrackingProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { registerCameraCanvas } = useDrawingContext();

  const { isLoading, error, handDetected, gesture } = useHandTracking({
    videoRef,
    canvasRef,
    onFrame,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return registerCameraCanvas(canvas);
  }, [registerCameraCanvas]);

  return (
    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-[var(--surface)] border border-[var(--surface-border)] shadow-inner">
      {/* Hidden raw webcam — visibility:hidden keeps the track active while invisible. */}
      <video
        ref={videoRef}
        playsInline
        muted
        style={{ visibility: 'hidden', position: 'absolute', inset: 0 }}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Status overlay — pinned to bottom so it never crowds the drawing area. */}
      <div className="absolute left-2 bottom-2 flex gap-2 text-xs font-semibold">
        {error ? (
          <span className="px-2 py-1 rounded-full bg-[var(--action)]/90 text-white">
            {error}
          </span>
        ) : isLoading ? (
          <span className="px-2 py-1 rounded-full bg-[var(--surface)]/90 text-[var(--text-primary)]">
            Loading camera...
          </span>
        ) : (
          <>
            <span
              className={`px-2 py-1 rounded-full ${
                handDetected
                  ? 'bg-[var(--accent)]/90 text-[var(--primary)]'
                  : 'bg-[var(--surface)]/90 text-[var(--text-primary)]'
              }`}
            >
              {handDetected ? 'Hand detected' : 'Show your hand'}
            </span>
            <span className="px-2 py-1 rounded-full bg-[var(--avatar-bg)]/90 text-white">
              {gesture}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

