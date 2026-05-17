# Gestures

Turns **MediaPipe hand landmarks** into **discrete gesture states** the rest of the app routes on. Also contains the coordinate-transform helper that bridges camera space and canvas space.

> **If you're an LLM asked to extend or modify this folder, read this whole file first.** The state vocabulary, detector contract, and coordinate transform are depended on by `Canvas.tsx`, `HandTracking.tsx`, and every file under `components/CanvasOperations/`. Silent breaks here cause silent breaks everywhere.

---

## The gesture vocabulary

Four states, exported from [`GestureTypes.ts`](./GestureTypes.ts):

| State | When | Downstream consumer |
|---|---|---|
| `NO_HAND` | No hand visible on screen | `Canvas` clears cursor + resets active op |
| `HAND_PRESENT` | Hand visible, no specific gesture | `CanvasLocation` shows pointer dot |
| `PINCH` | Thumb tip + index tip close together | `CanvasDraw` activates |
| `OPEN_PALM` | All four non-thumb fingers extended upward | `CanvasErase` activates |

The type is defined via the **`as const` object pattern**, not a TS `enum`. This is deliberate — see [Style notes](#style-notes).

---

## Architecture at a glance

```
            MediaPipe Hands (loaded from CDN, runs WASM)
                            │
                            ▼
            ┌─────────────────────────────────┐
            │     HandTracking.tsx            │
            │  - draws video + landmarks      │
            │  - calls detectGesture()        │
            │  - smooths via 5-frame buffer   │
            │  - calls onFrame(lm, gesture)   │
            └─────────────────────────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │ GestureRecogniser.ts     │
              │  (orchestrator)          │
              └────────────┬─────────────┘
                           │
          ┌────────────────┼────────────────────┐
          ▼                ▼                    ▼
    detectPinch     detectOpenPalm      detectHandOnScreen
          │                │                    │
          └────────────────┴────────────────────┘
                           │
                           ▼
                      GestureType
```

---

## File map

| File | Role |
|---|---|
| [`GestureTypes.ts`](./GestureTypes.ts) | The four-state string-literal union (`as const` object pattern) |
| [`GestureRecogniser.ts`](./GestureRecogniser.ts) | Orchestrator — calls each detector in priority order, returns a single `GestureType` |
| [`GestureUtils.ts`](./GestureUtils.ts) | Pure helper math. Currently just `distance(a, b)` |
| [`coords.ts`](./coords.ts) | `landmarkToCanvas(landmark, canvas)` — normalized → pixel mapping with mirror flip |
| [`detectors/detectPinch.ts`](./detectors/detectPinch.ts) | True when thumb tip + index tip are close (normalized by palm width) |
| [`detectors/detectOpenPalm.ts`](./detectors/detectOpenPalm.ts) | True when all four non-thumb fingertips are above their bases |
| [`detectors/detectHandOnScreen.ts`](./detectors/detectHandOnScreen.ts) | True when MediaPipe returned a complete 21-landmark set |

---

## The detector contract

Every file under `detectors/` exports **one function** with this shape:

```ts
function detectX(landmarks: HandLandmark[]): boolean
```

A pure predicate. No side effects, no canvas drawing, no logging. Given landmarks, return whether the gesture is currently true. The orchestrator handles ordering and fallthroughs.

The one exception: `detectHandOnScreen` accepts `HandLandmark[] | undefined` because it runs first and gates whether the others get called.

---

## Detection priority

`GestureRecogniser.detectGesture()` checks gates in this order:

1. `!detectHandOnScreen(landmarks)` → `NO_HAND`
2. `detectPinch(landmarks)` → `PINCH`
3. `detectOpenPalm(landmarks)` → `OPEN_PALM`
4. fallback → `HAND_PRESENT`

Order is deliberate. `PINCH` and `OPEN_PALM` are theoretically mutually exclusive (thumb curls in pinch, extends in open palm) but noisy frames can match both. The more constrained gesture (PINCH) wins.

---

## Stability buffer

`HandTracking.tsx` keeps a **5-frame buffer of raw gestures** and emits the **majority** to downstream consumers. This prevents single-frame detection flickers from toggling tools mid-stroke.

- A genuine gesture change takes ~3 frames (~50ms at 60fps) to take effect.
- Fast enough to feel responsive, slow enough to ignore jitter.
- To tune, find `gestureBuffer.current.length > 5` in `HandTracking.tsx` and change the constant.

---

## Coordinate transform (`coords.ts`)

MediaPipe returns landmarks normalized to `[0, 1]` in the **original, unmirrored** camera frame. The video feed and drawing canvas are displayed **mirrored horizontally** (so the user sees themselves like a mirror — standard UX).

`landmarkToCanvas()` does two things:

1. Multiply by canvas dimensions to get pixel coordinates.
2. **Flip x**: `(1 - landmark.x) * canvas.width`.

The flip exists so that when the user moves their right hand to the right side of their screen, the drawn point lands on the right side of the canvas. Without it, drawings appear mirrored relative to the user's hand.

> **If you change the mirror behavior of the canvas (e.g. remove the CSS `transform: scaleX(-1)` on the video display), you must also remove the flip in `coords.ts`. Mirror it once — not zero, not twice.**

---

## MediaPipe landmark reference

The 21 landmarks MediaPipe returns. Useful when writing detectors.

| Index | Body part |
|---|---|
| `0` | Wrist |
| `1`–`4` | Thumb (`4` = tip) |
| `5`–`8` | Index finger (`5` = base/MCP, `8` = tip) |
| `9`–`12` | Middle finger (`9` = base, `12` = tip) |
| `13`–`16` | Ring finger (`13` = base, `16` = tip) |
| `17`–`20` | Pinky (`17` = base, `20` = tip) |

Quick references used by current detectors:
- Fingertips: `[4, 8, 12, 16, 20]`
- Finger bases (knuckles): `[5, 9, 13, 17]` — note: thumb base is `2` but generally excluded from "all fingers extended" checks
- Palm width proxy: distance between landmarks `5` and `17` (index base to pinky base)

Each landmark has `{ x, y, z }`. `x` and `y` are normalized to `[0, 1]` in image space (y grows downward). `z` is depth relative to the wrist but is rarely used here.

---

## How to add a new gesture

Example: add `FIST` (closed hand).

1. **Add the state** to [`GestureTypes.ts`](./GestureTypes.ts):

   ```ts
   export const GestureType = {
     NO_HAND: 'NO_HAND',
     HAND_PRESENT: 'HAND_PRESENT',
     PINCH: 'PINCH',
     OPEN_PALM: 'OPEN_PALM',
     FIST: 'FIST',   // added
   } as const;
   ```

2. **Create a detector** at [`detectors/detectFist.ts`](./detectors/detectFist.ts):

   ```ts
   import type { HandLandmark } from '../../Models/HandLandmark';

   // Inverse of open palm: all four non-thumb fingertips are BELOW (higher y)
   // their bases, meaning the fingers are curled into the palm.
   const FINGER_TIPS = [8, 12, 16, 20];
   const FINGER_BASES = [5, 9, 13, 17];

   export function detectFist(landmarks: HandLandmark[]): boolean {
     return FINGER_TIPS.every(
       (tip, i) => landmarks[tip].y > landmarks[FINGER_BASES[i]].y,
     );
   }
   ```

3. **Register** in [`GestureRecogniser.ts`](./GestureRecogniser.ts). Insert it in priority order — more constrained gestures usually win over less constrained ones:

   ```ts
   if (detectPinch(landmarks!)) return GestureType.PINCH;
   if (detectFist(landmarks!)) return GestureType.FIST;        // added
   if (detectOpenPalm(landmarks!)) return GestureType.OPEN_PALM;
   ```

4. **(Optional) wire to a canvas op** — see [`../components/CanvasOperations/README.md`](../components/CanvasOperations/README.md) for the canvas-op recipe and how to add a cursor icon.

---

## Tuning detection

| File | Constant | Default | Meaning |
|---|---|---|---|
| `detectPinch.ts` | `PINCH_THRESHOLD` | `0.4` | Pinch fires when thumb-index distance is < 40% of palm width. Lower = tighter pinch required. |
| `detectHandOnScreen.ts` | `LANDMARK_COUNT` | `21` | MediaPipe always returns 21 when it sees a hand. Don't change unless you change the source. |
| `HandTracking.tsx` | buffer size | `5` frames | Higher = more stable, more lag. Lower = more responsive, more flicker. |

If users find pinch too sensitive (drawing happens when they're not trying to), drop `PINCH_THRESHOLD` to `0.3`. If it's too hard to trigger, raise it to `0.5`.

---

## Common gotchas

| Symptom | Likely cause |
|---|---|
| Filename case mismatch on Linux/CI | `GestureRecogniser.ts` was renamed from `.TS` (uppercase). Don't rename it back |
| Two gestures fire simultaneously | A higher-priority detector in `GestureRecogniser` is winning. Reorder or tighten thresholds |
| Drawings appear on the wrong side of canvas | The interplay between CSS `transform: scaleX(-1)` and the `(1 - x)` flip in `coords.ts` is misaligned — mirror should happen exactly once |
| Pinch triggers when hand goes near edge of frame | Palm-width normalization is degenerate when the hand is partially out of frame. Add a sanity check on `palmWidth > some_minimum` |
| Gesture seems "sticky" — won't change quickly | The 5-frame stability buffer in `HandTracking.tsx`. Lower it if you need faster transitions |

---

## Style notes

- **Detectors are pure functions, not classes.** They have no state. The state machine concerns live in the orchestrator and the stability buffer.
- **Magic numbers live as `const` at module top** so they're easy to tune without hunting through code.
- **Comments only explain *why*** — why the order matters, why the threshold is normalized by palm width, etc. They don't restate what well-named code already shows.
- **`as const` over `enum`.** Modern TypeScript docs recommend the `as const` object pattern. TS `enum` produces runtime objects with weird semantics (reverse mappings on numeric enums), doesn't tree-shake well, and `const enum` requires special Vite config. Don't convert.
