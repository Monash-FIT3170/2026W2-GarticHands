/**
 * Public API for the drawing subsystem.
 *
 * Pages should import from here, not from individual files inside `drawing/`:
 *
 * ```tsx
 * import { DrawingProvider, DrawingCameraInput, DrawingCameraCanvas } from '../drawing'
 *
 * <DrawingProvider>
 *   <DrawingCameraInput />
 *   <DrawingCameraCanvas />
 * </DrawingProvider>
 * ```
 *
 * Everything else (`HandTracking`, `Canvas`, gesture detectors, hooks) is an
 * implementation detail of these public components — don't reach into it from
 * Pages.
 */
export { DrawingProvider, useDrawing } from './DrawingContext';
export { default as DrawingCameraInput } from './components/DrawingCameraInput';
export { default as DrawingCameraCanvas } from './components/DrawingCameraCanvas';
export { useRecorder } from './useRecorder';
export {
  DrawingStage,
  DrawingModePicker,
  Panel as DrawingPanel,
  useDrawingMode,
  DRAW_MODES,
  type DrawMode,
  type DrawModeOption,
} from './DrawingStage';

// Tunable-settings vocabulary for the <DrawingProvider> props. App code that
// only needs these (e.g. SettingsContext) may import the dependency-free leaf
// `./DrawingSettings` directly instead of this index.
export {
  GESTURE_SENSITIVITIES,
  DEFAULT_GESTURE_SENSITIVITY,
  STROKE_SMOOTHING_LEVELS,
  DEFAULT_STROKE_SMOOTHING,
  type GestureSensitivity,
  type StrokeSmoothing,
} from './DrawingSettings';

// Type re-exports for callers that need to type their own handlers
export type { HandLandmark } from './Models/HandLandmark';
export type { GestureType } from './gestures/GestureTypes';
