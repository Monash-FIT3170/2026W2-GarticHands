# Drawing Input — Code Review

A running record of issues, fixes, and revisions for the `drawing-input/`
section of Gartic Hands. Items use checkbox markdown so they can be ticked
off as they're resolved.

Legend:
- `[x]` — done
- `[ ]` — pending
- **Bandaid** — temporary patch that unblocks the immediate problem; a
  permanent solution is recorded alongside it
- **Permanent** — proper structural fix; no follow-up work needed

---

## ISSUES (by file)

### `client/index.html`
- [x] MediaPipe `<script src>` URL had no version pinned — version drift
      between `hands.js` and the WASM sidecar caused the
      `Aborted(Module.arguments has been replaced)` runtime error

### `client/src/main.tsx`
- [ ] Triple `./index.css` import (one is needed, two are dead duplicates)
- [ ] Unused `React` and `ReactDOM` default imports

### `client/src/App.tsx`
- [x] Demo widgets (Counter, Text Display, Form Input) cluttered the file
- [x] `Card` import pointed at `./components/Card`; file was actually in `./composables/`

### `client/src/composables/Card.tsx`
- [ ] Untyped `{ children }` — implicit `any` in a `.tsx` file
- [ ] Tailwind classes used but Tailwind plugin not configured in Vite —
      they render as dead text

### `client/src/components/Canvas.tsx`
- [x] Used `forwardRef` (deprecated in React 19)
- [x] `useImperativeHandle` was missing its deps array — handle rebuilt every render
- [x] Single canvas mixed cursor and drawing — cursor would bake into the artwork

### `client/src/components/HandTracking.tsx`
- [ ] **Double-mirror bug** — camera context is mirrored in `onResults`
      (lines 72-74) *and* again via CSS `transform: scaleX(-1)`
      (line 353). Net result: a non-mirrored display. Causes the drawing
      canvas to land strokes on the opposite side from where the user
      sees their hand.
- [ ] Canvas buffer resized every frame (`canvas.width = 640;` inside
      `onResults`) — clears the canvas as a side effect, runs 30-60×/sec
- [ ] File contradicts its own header — comments say "no smoothing /
      no gesture state machines" but the file contains the 5-frame
      stability buffer
- [ ] `drawLandmarks` and `drawConnections` defined inside `useEffect` —
      not testable, hide file length
- [ ] `connections` array re-allocated on every call (should be a
      module-scope `const`)
- [ ] `React.FC` used (officially discouraged in modern React)
- [ ] `any` types throughout (`hands`, `results`, `landmarks`,
      `(window as any).Hands`)
- [ ] `hands.send()` errors are unhandled — produces unhandled promise
      rejections
- [ ] rAF loop never exits — keeps scheduling forever even after cleanup
- [ ] `<video style={{ display: 'none' }}>` can be throttled / paused by
      some browsers
- [ ] No error recovery — once errored, only a page reload fixes
- [ ] `maxNumHands: 2` set but only `multiHandLandmarks[0]` is read — wasted compute
- [ ] O(n²) majority-vote reducer in the stability buffer (cosmetic)
- [x] **Bandaid applied:** MediaPipe CDN version pinned in `locateFile`
      (permanent solution: migrate to `@mediapipe/tasks-vision` — see
      cross-cutting issue below)

### `client/src/components/CanvasOperations/`
- [x] `CanvasOp` contract used `isActive: boolean` — pushed routing
      logic into every op
- [x] `CanvasLocation` was a `CanvasOp` with a `start/end` lifecycle that
      didn't fit its passive cursor role
- [x] Cursor disappeared during PINCH and OPEN_PALM — no visual feedback
      on which mode was active
- [x] No icons for tools — couldn't visually distinguish pencil from eraser
- [x] No documentation for forkers or LLMs

### `client/src/gestures/`
- [x] All detection crammed into one `GestureRecogniser` function — not
      testable in isolation
- [x] `NONE` was overloaded — meant both "no hand visible" and "hand
      visible, no specific gesture"
- [x] No `HAND_PRESENT` state — couldn't route to a cursor on neutral pose
- [x] `GestureRecogniser.TS` had uppercase `.TS` extension — would break
      on case-sensitive filesystems
- [x] `detectHandOnScreen` returned plain `boolean` instead of a TS
      type predicate
- [x] Non-null `!` assertions in `GestureRecogniser` after the predicate guard
- [x] No documentation for forkers or LLMs

### Cross-cutting
- [ ] Project is still on `@mediapipe/hands` (maintenance mode). The
      version-pin bandaid stops the immediate crash but the permanent
      fix is migration to `@mediapipe/tasks-vision`

---

## FIXES

### Bandaids applied (temporary patches with permanent follow-ups)

- **MediaPipe version pin**
  - *Bandaid:* pinned `@mediapipe/hands@0.4.1675469240` in
    `client/index.html` and in `client/src/components/HandTracking.tsx`
    (`locateFile` callback). Both URLs now resolve to the same version,
    so the JS shim and the WASM sidecar are ABI-compatible.
  - *Why it's a bandaid:* keeps the project on a maintenance-mode
    package with no type safety, no proper lockfile-managed versioning,
    and CDN-based delivery (vulnerable to network and CDN cache issues).
  - *Permanent solution (pending):* migrate to `@mediapipe/tasks-vision`.
    Single npm install, TypeScript types included, synchronous
    `detectForVideo()` instead of `onResults` callback, WASM versions
    pinned by the package version itself. Only `index.html` and
    `HandTracking.tsx` are affected by the migration — every other
    file under `gestures/`, `Models/`, and `components/CanvasOperations/`
    works unchanged because the landmark shape is identical.

### Permanent solutions applied

- **Canvas architecture** — two stacked `<canvas>` elements (drawing
  layer + transparent overlay). Drawing layer accumulates strokes;
  overlay clears every frame. Overlay is `pointer-events: none` so it
  never blocks input.

- **Gesture pipeline split** — renamed `GestureRecogniser.TS` → `.ts`,
  extracted detection logic into three pure-predicate files under
  `detectors/`, added `gestures/coords.ts` for normalized → pixel
  mapping with mirror flip.

- **Four-state gesture vocabulary** — expanded from 3 (`NONE`, `PINCH`,
  `OPEN_PALM`) to 4 (`NO_HAND`, `HAND_PRESENT`, `PINCH`, `OPEN_PALM`).
  Removes the ambiguity `NONE` used to carry.

- **Type-predicate narrowing** — `detectHandOnScreen` now returns
  `landmarks is HandLandmark[]`. Removed `!` non-null assertions from
  the orchestrator.

- **CanvasOp contract** — replaced `isActive: boolean` with
  `activatedBy: GestureType` declared per op. Coordinator routes one op
  at a time; ops just `tick(point)` when called.

- **CanvasLocation decoupled** — no longer implements `CanvasOp`. Has
  its own `render(point, gesture)` and `clear()` methods. Renders
  different icons per gesture: blue dot (HAND_PRESENT), pencil (PINCH),
  sponge (OPEN_PALM).

- **React 19 modernization in `Canvas.tsx`** — dropped `forwardRef`,
  switched to ref-as-prop. `useImperativeHandle` now has `[]` deps so
  the handle is built once.

- **Documentation** — per-folder READMEs in
  `components/CanvasOperations/` and `gestures/`. Cover the contracts,
  lifecycles, recipes for adding new ops/gestures, invariants, and
  gotcha → cause tables. Designed for both human forkers and LLM
  consumption.

### Permanent solutions pending

- HandTracking refactor — see the file's full checklist above.
  Highest-impact items: fix the double-mirror bug, hoist the helper
  functions out of `useEffect`, reduce `any` usage, properly bound the
  rAF loop on cleanup.
- `Card.tsx` props typing (and decide whether to keep the Tailwind
  classes or remove them)
- `main.tsx` cleanup
- Migrate to `@mediapipe/tasks-vision` (replaces the version-pin bandaid)

---

## REVISIONS (by file)

### `client/index.html` *(modified — bandaid)*
- Pinned MediaPipe CDN version on the `<script>` tag

### `client/src/Models/Point.ts` *(new)*
Shared `{ x, y }` interface used across canvas and gesture code. Defined
here so neither gesture code nor canvas code depends on the other.

### `client/src/gestures/GestureTypes.ts` *(modified)*
- Expanded from 3 states to 4: added `NO_HAND` and `HAND_PRESENT`
- Continues to use the `as const` object pattern (not TS `enum`)

### `client/src/gestures/GestureRecogniser.ts` *(new — replaces `.TS`)*
Orchestrator. Calls each detector in priority order (`NO_HAND` first,
then `PINCH`, then `OPEN_PALM`, then `HAND_PRESENT` fallback). Uses the
type predicate from `detectHandOnScreen` to narrow `landmarks` for
subsequent calls — no `!` assertions.

### `client/src/gestures/coords.ts` *(new)*
`landmarkToCanvas(landmark, canvas)` — converts MediaPipe's normalized
[0, 1] landmark coordinates to canvas pixel coordinates with mirror
flip on the x-axis. See the **WHY** section for the mirror rationale.

### `client/src/gestures/detectors/detectPinch.ts` *(new)*
Pure-predicate detector. True when thumb tip and index tip are closer
than 40% of palm width. Threshold normalized by palm size so it
survives the user moving toward or away from the camera.

### `client/src/gestures/detectors/detectOpenPalm.ts` *(new)*
Pure-predicate detector. True when all four non-thumb fingertips are
above their bases on the y-axis.

### `client/src/gestures/detectors/detectHandOnScreen.ts` *(new)*
Type-predicate detector. Returns `landmarks is HandLandmark[]` so the
orchestrator gets free type narrowing.

### `client/src/gestures/README.md` *(new)*
Folder-level documentation. Covers the four-state vocab, detector
contract, priority order, coordinate-transform rationale, MediaPipe
landmark index reference, and "how to add a new gesture" recipe.

### `client/src/components/Canvas.tsx` *(new)*
Two-layer drawing surface. Exposes an imperative handle (`onFrame`)
via React 19 ref-as-prop. Per-frame routing:
- Find the op whose `activatedBy` matches the current gesture
- Reset the outgoing op if the gesture changed
- Convert `landmarks[8]` (index fingertip) to canvas pixels via
  `landmarkToCanvas`
- Always render the cursor on the overlay; tick the active op (if any)
  on the drawing layer

### `client/src/components/CanvasOperations/CanvasOps.ts` *(new)*
Defines the `CanvasOp` interface: `name`, `activatedBy`, `tick(point)`,
`reset()`. Routing happens at the coordinator, not inside ops.

### `client/src/components/CanvasOperations/CanvasDraw.ts` *(new)*
Implements `CanvasOp`. Activated by `PINCH`. Draws line segments from
the previous point to the current point each frame. `reset()` nulls
`prevPoint` so the next pinch starts a fresh stroke.

### `client/src/components/CanvasOperations/CanvasErase.ts` *(new)*
Implements `CanvasOp`. Activated by `OPEN_PALM`. Erases pixels in a
configurable radius around the current point using
`globalCompositeOperation = 'destination-out'`.

### `client/src/components/CanvasOperations/CanvasLocation.ts` *(new)*
Cursor renderer. Not a `CanvasOp`. Has its own `render(point, gesture)`
and `clear()` methods. Renders a translucent blue dot (HAND_PRESENT),
a pencil (PINCH), or a sponge (OPEN_PALM) depending on the current
gesture.

### `client/src/components/CanvasOperations/README.md` *(new)*
Folder-level documentation. Covers the `CanvasOp` contract, per-frame
lifecycle, "how to add a new operation" recipe, invariants, and
gotcha → cause tables.

### `client/src/components/HandTracking.tsx` *(modified)*
- Added `HandTrackingProps` interface with an `onFrame` callback prop
- Stable-ref pattern (`onFrameRef`) so the MediaPipe `onResults`
  closure always sees the current callback
- Fires `onFrame(landmarks, stableGesture)` every frame when a hand is
  present; fires `onFrame(null, NO_HAND)` when no hand is detected
- Initial gesture state changed from `NONE` to `NO_HAND`
- *Bandaid:* pinned MediaPipe CDN version in `locateFile`

### `client/src/App.tsx` *(modified)*
- Stripped Counter, Text Display, and Form Input demo widgets
- Removed broken `Card` import (path was wrong)
- Wired `<HandTracking>` and `<Canvas>` via a `useRef<CanvasHandle>`
  and a stable `useCallback` `onFrame` handler

### Deleted
- `client/src/gestures/GestureRecogniser.TS` (uppercase extension)
- `client/src/components/CanvasOperations/CanvasOps.tsx` (stub)
- `client/src/components/CanvasOperations/CanvasDraw.tsx` (stub)
- `client/src/components/CanvasOperations/CanvasErase.tsx` (stub)
- `client/src/components/CanvasOperations/CanvasLocation.tsx` (stub)

---

## WHY

### Layered canvas vs single canvas
A single canvas can't be both "persistent artwork" and "transient
cursor." Clear the canvas every frame and the artwork dies; preserve
the artwork and the cursor smears across the canvas. Two stacked
`<canvas>` elements let each behave correctly — the overlay clears
every frame; the drawing canvas accumulates strokes indefinitely.

### `activatedBy` vs `isActive`
The earlier `isActive` boolean required each op to check whether it
should run. That pushed control flow into every op (`if (!isActive)
return;`) and made the contract noisier than it needed to be. With
`activatedBy: GestureType` declared per op, the coordinator picks
which op to call — ops just *do their thing* without gatekeeping.
Cleaner separation of "deciding what runs" from "how it runs."

### CanvasLocation not implementing CanvasOp
Draw and Erase have a clear lifecycle: gesture starts → tick
repeatedly → gesture ends → reset state. Location has no such
lifecycle — it's always showing where the hand is, regardless of which
gesture is active. Forcing it into a start/end contract gave it no-op
methods and an awkward `activatedBy` value. Decoupling it keeps the
contract honest: `CanvasOp` is for drawing operations only;
`CanvasLocation` is its own thing — a cursor renderer.

### Four-state gesture vocab vs three
`NONE` was overloaded. It meant either "no hand visible" or "a hand is
visible but no specific gesture is recognized." Both states existed
at runtime but couldn't be distinguished. Splitting into `NO_HAND` and
`HAND_PRESENT` makes the cursor case ("hand is on screen, show
pointer") routable as its own gesture, and lets the canvas correctly
clear the overlay when the hand leaves the frame.

### Mirror flip in coords.ts
MediaPipe gives landmarks in normalized [0, 1] in the *original*
(unmirrored) camera frame. The webcam display is conventionally
mirrored so the user sees themselves like a mirror. Multiplying x by
canvas width directly would put drawings on the wrong side of where
the user's hand appears. The `(1 - x)` flip in `landmarkToCanvas`
aligns drawn points with the visible hand.

**Caveat:** see the double-mirror issue in `HandTracking.tsx`.
HandTracking currently has two flips that cancel out, so the live
display is *not* actually mirrored. Once that's fixed, this alignment
will work as designed. The fix belongs in `HandTracking.tsx`, not in
`coords.ts`.

### Bandaid vs permanent for MediaPipe
The version pin is a bandaid. It fixes the immediate runtime error
(`Aborted(Module.arguments has been replaced)`) by guaranteeing that
`hands.js` and the WASM sidecars resolve to the same version — but it
keeps the project on `@mediapipe/hands`, which is in maintenance mode.
The permanent solution is migration to `@mediapipe/tasks-vision`. That
package:
- Ships a single npm install (no CDN script tag, no unpinned URLs)
- Has TypeScript types
- Exposes a synchronous `detectForVideo()` instead of the `onResults`
  callback pattern
- Bundles a stable version of the WASM runtime pinned by the package
  version itself

Migration affects only `HandTracking.tsx` and `index.html`. Everything
under `gestures/`, `Models/`, and `components/CanvasOperations/` works
unchanged because the landmark shape (`{x, y, z}` normalized 0-1) is
identical.

### Custom gestures vs MediaPipe's built-in classifier
The Tasks Vision API ships a `GestureRecognizer` with built-in
categories: Closed_Fist, Open_Palm, Pointing_Up, Thumb_Up, Thumb_Down,
Victory, ILoveYou. `Open_Palm` maps directly to our `OPEN_PALM`, but
the classifier has no `PINCH` gesture — and pinch is the draw trigger.
Using the built-in classifier would mean losing the draw gesture.

The custom pipeline under `gestures/` already supports tunable
thresholds (`PINCH_THRESHOLD`), priority ordering, and clean extension
to new gestures (FIST, peace sign, etc.). Switching to the black-box
classifier would be a regression on flexibility. When the migration
to `tasks-vision` happens, we'll use `HandLandmarker` (raw landmarks
only, no classifier) and keep the custom detection pipeline.

---

## REFERENCES

### MediaPipe (current — legacy Solutions API)
- **Hands solution docs** — https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/hands.md
  - Covers the `@mediapipe/hands` package currently loaded via CDN.
  - 21-landmark hand model, configuration options (`maxNumHands`,
    `modelComplexity`, `minDetectionConfidence`,
    `minTrackingConfidence`), and the legacy `onResults` callback API.
  - Reference this when tuning `hands.setOptions(...)` in
    `HandTracking.tsx`, or when looking up which landmark index
    corresponds to which knuckle/joint.

### MediaPipe (migration target — modern Tasks Vision API)
- **Gesture Recognizer docs** — https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer
  - Covers `@mediapipe/tasks-vision` — the actively maintained package
    that supersedes `@mediapipe/hands`.
  - Includes the built-in gesture classifier (Closed_Fist, Open_Palm,
    Pointing_Up, Thumb_Up, Thumb_Down, Victory, ILoveYou). Note: no
    PINCH category — see the **WHY** section on why we keep our
    custom detection pipeline rather than relying on the built-in
    classifier.
  - For our use case, `HandLandmarker` (landmarks only, no classifier)
    is the more direct migration target. The `gesture_recognizer` docs
    are still the best reference for the Tasks Vision setup pattern
    (`FilesetResolver`, `createFromOptions`, `detectForVideo`).
