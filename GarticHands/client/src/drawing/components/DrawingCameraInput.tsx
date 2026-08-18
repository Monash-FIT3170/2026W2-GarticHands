import HandTracking from './HandTracking';
import { useDrawingContext } from '../DrawingContext';

/**
 * Webcam-fed hand-tracking input. Renders the video element + landmark overlay and
 * forwards each detected frame to the `<DrawingCameraCanvas>` via context.
 *
 * Must be a descendant of `<DrawingProvider>`. Pages don't pass any props — the
 * wiring is internal.
 */
export default function DrawingCameraInput() {
  const { pushFrame } = useDrawingContext();
  return <HandTracking onFrame={pushFrame} />;
}
