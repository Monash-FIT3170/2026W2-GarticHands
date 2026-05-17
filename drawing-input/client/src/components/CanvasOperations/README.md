# Canvas Operations

Everything the user's hand can do to the drawing canvas: **draw**, **erase**, and **show a cursor**.

> **If you're an LLM asked to extend or modify this folder, read this whole file first.** The contract and invariants below matter — the code that wires this folder up (`Canvas.tsx`, `HandTracking.tsx`) depends on them and will break if you violate them silently.

---

## Architecture at a glance

```
       Hand landmarks + GestureType
                 │
                 ▼
   ┌────────────────────────────────┐
   │   Canvas.tsx  (coordinator)    │
   │   - selects the active op      │
   │   - converts landmark → Point  │
   │   - always runs the cursor     │
   └────────────────────────────────┘
                 │
   ┌─────────────┼──────────────────┐
   ▼             ▼                  ▼
CanvasDraw    CanvasErase     CanvasLocation
 (PINCH)      (OPEN_PALM)       (cursor — always on)
   │             │                  │
   ▼             ▼                  ▼
 Drawing canvas (bottom layer)   Overlay canvas (top layer)
```

Two stacked `<canvas>` elements live inside `Canvas.tsx`:

| Layer | Purpose | Written to by |
|---|---|---|
| Drawing canvas (bottom) | Persistent artwork — strokes accumulate here | `CanvasDraw`, `CanvasErase` |
| Overlay canvas (top) | Cursor icon, cleared every frame | `CanvasLocation` |

The overlay has `pointer-events: none` so it never intercepts mouse input.

---

## The `CanvasOp` contract

Defined in [`CanvasOps.ts`](./CanvasOps.ts). Every drawing operation must implement:

```ts
interface CanvasOp {
  readonly name: string;
  readonly activatedBy: GestureType;
  tick(point: Point): void;
  reset(): void;
}
```

| Member | Meaning |
|---|---|
| `name` | Unique identifier for debugging/logging |
| `activatedBy` | The single `GestureType` that triggers this op |
| `tick(point)` | Called every frame the op is active. `point` is the index fingertip in canvas pixel coordinates |
| `reset()` | Called when the gesture transitions away from this op — clears in-progress state (e.g. a half-drawn stroke) |

The coordinator routes **exactly one** drawing op per frame. If you need parallel behavior (cursor + drawing), one side must live outside this contract — that's exactly what `CanvasLocation` does.

---

## File map

| File | Role | Implements `CanvasOp`? |
|---|---|---|
| [`CanvasOps.ts`](./CanvasOps.ts) | Interface + shared types | — (it *defines* the interface) |
| [`CanvasDraw.ts`](./CanvasDraw.ts) | Pencil stroke when pinching | Yes, `activatedBy = PINCH` |
| [`CanvasErase.ts`](./CanvasErase.ts) | Wipes pixels when palm is open | Yes, `activatedBy = OPEN_PALM` |
| [`CanvasLocation.ts`](./CanvasLocation.ts) | Always-on cursor icon | **No** — own contract: `render(point, gesture)` + `clear()` |

`CanvasLocation` is intentionally **not** a `CanvasOp` — it needs to run on every frame a hand is visible (not just one specific gesture), so it sits outside the routing system.

---

## Per-frame lifecycle

1. `HandTracking.tsx` runs the MediaPipe loop → computes a stabilized `GestureType` → calls `onFrame(landmarks, gesture)`.
2. `App.tsx` forwards that call to `Canvas.tsx` via a ref.
3. `Canvas.tsx`:
   1. Finds the op whose `activatedBy === gesture` (may be none).
   2. If the active op changed since last frame, calls `reset()` on the outgoing op.
   3. If `landmarks` is non-null:
      - Converts `landmarks[8]` (index fingertip) to canvas pixels via `gestures/coords.ts:landmarkToCanvas()`.
      - Calls `cursor.render(point, gesture)` — always, regardless of which op is active.
      - Calls `activeOp.tick(point)` if an op matched.
   4. If `landmarks` is null (no hand): clears the cursor overlay.

---

## How to add a new operation

Example: add `CanvasFill` triggered by a closed fist.

1. **Add the gesture state** — see [`../../gestures/README.md`](../../gestures/README.md) for the recipe.

2. **Create [`CanvasFill.ts`](./CanvasFill.ts):**

   ```ts
   import type { CanvasOp } from './CanvasOps';
   import type { Point } from '../../Models/Point';
   import { GestureType } from '../../gestures/GestureTypes';

   export class CanvasFill implements CanvasOp {
     readonly name = 'fill';
     readonly activatedBy = GestureType.FIST;

     constructor(private readonly ctx: CanvasRenderingContext2D) {}

     tick(point: Point): void {
       // your fill logic — runs every frame while the gesture is held
     }

     reset(): void {
       // clear any in-progress state when user switches away
     }
   }
   ```

3. **Register it** in [`../Canvas.tsx`](../Canvas.tsx):

   ```ts
   stateRef.current = {
     ops: [
       new CanvasDraw(drawCtx),
       new CanvasErase(drawCtx),
       new CanvasFill(drawCtx),   // added
     ],
     cursor: new CanvasLocation(overlayCtx),
     active: null,
   };
   ```

4. **Add a cursor icon** in `CanvasLocation.ts`'s `render` switch:

   ```ts
   case GestureType.FIST:
     this.drawIcon(point, '🪣');
     return;
   ```

That's it. No other wiring required.

---

## Invariants

Break these and you'll see subtle bugs that don't surface in TypeScript.

- **Both canvases must be the same dimensions.** The coordinator computes the cursor point against `drawCanvas` and assumes the overlay shares its size.
- **`activatedBy` must be unique across ops.** `Array.find()` returns the first match — duplicate triggers mean only the first op ever runs.
- **`reset()` must clear all in-progress state.** If `CanvasDraw` doesn't null its `prevPoint`, the next pinch will draw a line from the last fingertip position of the previous pinch.
- **`CanvasLocation` writes to the overlay, never the drawing canvas.** Mixing them up bakes the cursor into the artwork on every frame.

---

## Coordinate system

All ops receive `Point` in **canvas pixel coordinates** (origin top-left, x grows right, y grows down). The transform happens once in `gestures/coords.ts:landmarkToCanvas()` — ops never see normalized landmark coordinates.

The x-axis is mirror-flipped during conversion because the camera feed is displayed mirrored. Don't add a second mirror in your op code.

---

## Common gotchas

| Symptom | Likely cause |
|---|---|
| My new op isn't running | Gesture isn't being detected — check `Gesture: ...` text in `HandTracking`. Or `activatedBy` doesn't match the GestureType value. |
| Strokes connect across pinches | `reset()` isn't being called, or isn't clearing `prevPoint` |
| Cursor freezes / trails | `CanvasLocation.render()` calls `clear()` first. If you removed that, the cursor will smear |
| Stroke appears on the opposite side of where my hand is | The mirror flip in `coords.ts` was double-applied or removed. See gestures README |
| Op runs but nothing visible | Stroke color matches canvas background, or `lineWidth` is 0, or the point is off-canvas |
