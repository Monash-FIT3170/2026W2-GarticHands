import { useCallback, useEffect } from 'react';

import HandTracking from './HandTracking';
import { useDrawingContext } from '../DrawingContext';
import { GestureType } from '../gestures/GestureTypes';
import type { HandLandmark } from '../Models/HandLandmark';
import type { GestureType as Gesture } from '../gestures/GestureTypes';

interface DrawingCameraInputProps {
  enabled?: boolean;
}

/**
 * Webcam-fed hand-tracking input. Renders the video element + landmark overlay and
 * forwards each detected frame to the `<DrawingCameraCanvas>` via context.
 *
 * Must be a descendant of `<DrawingProvider>`. Pages don't pass any props — the
 * wiring is internal.
 */
export default function DrawingCameraInput({ enabled = true }: DrawingCameraInputProps) {
  const { pushFrame } = useDrawingContext();

  const handleFrame = useCallback(
    (landmarks: HandLandmark[] | null, gesture: Gesture) => {
      if (!enabled) {
        return;
      }

      pushFrame(landmarks, gesture);
    },
    [enabled, pushFrame],
  );

  useEffect(() => {
    if (!enabled) {
      pushFrame(null, GestureType.NO_HAND);
    }
  }, [enabled, pushFrame]);

  return <HandTracking onFrame={handleFrame} />;
}
