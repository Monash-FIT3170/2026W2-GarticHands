/**
 * Externally-tunable knobs for the drawing subsystem.
 *
 * The drawing module is self-contained — it never reads app state. App code
 * (e.g. `SettingsContext`) owns the user's choice and passes it in through
 * `<DrawingProvider>` props; this module defines the shared vocabulary both
 * sides speak.
 *
 * This file must stay a dependency-free leaf so settings consumers outside
 * `drawing/` can import it without dragging the rest of the drawing bundle
 * (MediaPipe, canvas components, …) into their module graph.
 *
 * Every `default` level MUST map to the stock value so the default experience
 * stays byte-identical to the untuned app.
 */

/** How easily gestures trigger. `default` preserves the stock thresholds exactly. */
export type GestureSensitivity = 'low' | 'default' | 'high';

/** All selectable sensitivities, in the order the settings panel lists them. */
export const GESTURE_SENSITIVITIES: readonly GestureSensitivity[] = ['low', 'default', 'high'];

export const DEFAULT_GESTURE_SENSITIVITY: GestureSensitivity = 'default';

/**
 * Multiplier applied to normalized gesture-detection thresholds (currently the
 * pinch thumb-to-index distance, expressed as a fraction of palm width).
 * `> 1` = looser trigger (gestures fire more easily), `< 1` = tighter trigger.
 *
 * The low/high factors put the effective pinch threshold at 0.3 / 0.5 — the
 * exact tuning range recommended in `gestures/README.md § Tuning detection`.
 */
export const GESTURE_THRESHOLD_SCALE: Record<GestureSensitivity, number> = {
  low: 0.75,
  default: 1,
  high: 1.25,
};

/** How aggressively strokes are smoothed. `default` preserves the stock behavior exactly. */
export type StrokeSmoothing = 'light' | 'default' | 'strong';

/** All selectable smoothing levels, in the order the settings panel lists them. */
export const STROKE_SMOOTHING_LEVELS: readonly StrokeSmoothing[] = ['light', 'default', 'strong'];

export const DEFAULT_STROKE_SMOOTHING: StrokeSmoothing = 'default';

/**
 * Exponential-moving-average blend factor used by `CanvasDraw`. Higher =
 * follows the fingertip faster (less smoothing); lower = smoother, laggier
 * strokes. `default` is the stock `CanvasDraw` factor of 0.5.
 */
export const STROKE_SMOOTHING_ALPHA: Record<StrokeSmoothing, number> = {
  light: 0.75,
  default: 0.5,
  strong: 0.25,
};
