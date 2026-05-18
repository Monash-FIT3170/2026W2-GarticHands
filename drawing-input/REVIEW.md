# Drawing Input — Code Review

A running record of issues, fixes, and revisions for the `drawing-input/`
section of Gartic Hands. Items use checkbox markdown so you can tick them
off as they get resolved.

Legend:
- `[x]` — done
- `[ ]` — pending
- `[GROUPMATE]` — lives in `HandTracking.tsx`, owned by your teammate

---

## ISSUES

### Canvas + Gesture architecture
- [x] Demo widgets (Counter, Text Display, Form Input) cluttered `App.tsx`
- [x] `Card` import in `App.tsx` pointed at `./components/Card`, file was actually in `./composables/`
- [x] Single canvas mixing cursor and drawing — cursor would bake into the artwork on every frame
- [x] No documentation for Canvas/Gesture systems — hard for forkers and LLMs to extend safely

### Gesture detection
- [x] All detection logic crammed into one `GestureRecogniser` function — not testable in isolation
- [x] `NONE` was ambiguous — meant *both* "no hand visible" and "hand visible, no specific gesture"
- [x] No `HAND_PRESENT` state — couldn't route to a cursor on neutral hand pose
- [x] `GestureRecogniser.TS` had uppercase `.TS` extension — would break on case-sensitive filesystems (Linux, some CI)
- [x] `detectHandOnScreen` returned plain `boolean` instead of a TS type predicate
- [x] Non-null `!` assertions in `GestureRecogniser` after the predicate-style guard

### Canvas operations
- [x] `CanvasOp` contract used `isActive: boolean` — pushed routing logic into every op (`if (!isActive) return`)
- [x] `CanvasLocation` was a `CanvasOp` with a `start/end` lifecycle that didn't fit its passive cursor role
- [x] Cursor disappeared during PINCH/OPEN_PALM — no visual feedback on which mode was active
- [x] No icons for tools — couldn't visually distinguish pencil from eraser

### React principles
- [x] `Canvas.tsx` used `forwardRef` (deprecated in React 19)
- [x] `Canvas.tsx` `useImperativeHandle` missing deps array — handle rebuilt every render
- [ ] `Card.tsx` destructures `{ children }` with no type — implicit `any` in a `.tsx` file
- [ ] `main.tsx` has triple `./index.css` import + unused `React` / `ReactDOM` default imports
- [ ] Tailwind classes used in `Card.tsx` but Tailwind plugin is not configured in Vite — classes are dead text

### MediaPipe
- [x] `hands.js` and WASM sidecar URLs both unpinned — version drift caused `Aborted(Module.arguments has been replaced)` runtime error
- [ ] On `@mediapipe/hands` (in maintenance mode) — should migrate to `@mediapipe/tasks-vision` for production

### HandTracking.tsx (groupmate's section — share with him)
- [ ] [GROUPMATE] **Double-mirror bug** — camera context mirrored in `onResults` (lines 72-74) *and* again via CSS `transform: scaleX(-1)` (line 353). Net result: non-mirrored display. Causes the drawing canvas to land strokes on the opposite side from where the user sees their hand.
- [ ] [GROUPMATE] Canvas buffer resized every frame (`canvas.width = 640;` inside `onResults`) — clears canvas as side effect, runs 30-60×/sec
- [ ] [GROUPMATE] File contradicts its own header — comments say "no smoothing / no gesture state machines" but the file contains the 5-frame stability buffer
- [ ] [GROUPMATE] `drawLandmarks` and `drawConnections` defined inside `useEffect` — not testable, hide file length
- [ ] [GROUPMATE] `connections` array re-allocated every call (should be a module-scope `const`)
- [ ] [GROUPMATE] `React.FC` used (officially discouraged in modern React)
- [ ] [GROUPMATE] `any` types throughout (`hands`, `results`, `landmarks`, `(window as any).Hands`)
- [ ] [GROUPMATE] `hands.send()` errors are unhandled — produces unhandled promise rejections
- [ ] [GROUPMATE] rAF loop never exits — keeps scheduling forever even after cleanup
- [ ] [GROUPMATE] `<video style={{ display: 'none' }}>` can be throttled / paused by some browsers
- [ ] [GROUPMATE] No error recovery — once errored, only page reload fixes
- [ ] [GROUPMATE] `maxNumHands: 2` set but only `[0]` is read — wasted compute
- [ ] [GROUPMATE] O(n²) majority-vote reducer in the stability buffer (cosmetic)

---

## FIXES (applied)

### Canvas architecture
- Built two stacked `<canvas>` elements in `Canvas.tsx` — drawing layer (bottom) + transparent overlay (top)
- Drawing layer accumulates strokes (`CanvasDraw`, `CanvasErase`)
- Overlay layer holds the cursor (`CanvasLocation`), cleared every frame
- Overlay has `pointer-events: none` so it doesn't block mouse input

### Gesture pipeline
- Renamed `GestureRecogniser.TS` → `GestureRecogniser.ts`
- Split detection into three pure-predicate files under `detectors/`: `detectPinch.ts`, `detectOpenPalm.ts`, `detectHandOnScreen.ts`
- Expanded vocab from 3 states to 4: `NO_HAND`, `HAND_PRESENT`, `PINCH`, `OPEN_PALM`
- `detectHandOnScreen` now returns `landmarks is HandLandmark[]` — type narrows for subsequent calls
- Removed `!` non-null assertions from `GestureRecogniser` (the predicate handles narrowing for free)
- Added `gestures/coords.ts` with `landmarkToCanvas()` — converts normalized landmarks to canvas pixel coordinates with mirror flip
- New `Models/Point.ts` for the shared `{x, y}` type (no longer pulled from `CanvasOps`)

### CanvasOp contract
- Replaced `isActive: boolean` with `activatedBy: GestureType` declared per op
- Routing happens once at the coordinator — ops just `tick(point)` when called
- `CanvasLocation` removed from the `CanvasOp` contract entirely; it's now a cursor renderer with its own `render(point, gesture)` / `clear()` API
- Cursor renders different icons per gesture: blue dot (HAND_PRESENT), pencil ✏️ (PINCH), sponge 🧽 (OPEN_PALM)

### React
- `Canvas.tsx` migrated to the React 19 ref-as-prop pattern (no `forwardRef`)
- `useImperativeHandle` in `Canvas.tsx` now has `[]` deps so the handle is only built once

### MediaPipe
- Pinned `@mediapipe/hands@0.4.1675469240` in both `index.html` and `HandTracking.tsx`'s `locateFile` callback
- Fixes the `Module.arguments has been replaced` runtime error caused by version drift between `hands.js` and the WASM sidecar

### Documentation
- `components/CanvasOperations/README.md` — covers the `CanvasOp` contract, per-frame lifecycle, "how to add a new operation" recipe, invariants, and gotcha → cause table
- `gestures/README.md` — covers the four-state vocabulary, detector contract, priority order, coordinate-transform rationale, MediaPipe landmark index reference, and "how to add a new gesture" recipe
- Both designed for LLM consumption: stated invariants, code-block contracts, concrete recipes, no implicit context

---

## REVISIONS (files changed)

### New files
- `Models/Point.ts`
- `gestures/coords.ts`
- `gestures/GestureRecogniser.ts` (replaces `.TS`)
- `gestures/detectors/detectPinch.ts`
- `gestures/detectors/detectOpenPalm.ts`
- `gestures/detectors/detectHandOnScreen.ts`
- `gestures/README.md`
- `components/Canvas.tsx`
- `components/CanvasOperations/CanvasOps.ts`
- `components/CanvasOperations/CanvasDraw.ts`
- `components/CanvasOperations/CanvasErase.ts`
- `components/CanvasOperations/CanvasLocation.ts`
- `components/CanvasOperations/README.md`

### Deleted files
- `gestures/GestureRecogniser.TS` (uppercase extension)
- `components/CanvasOperations/CanvasOps.tsx` (stub)
- `components/CanvasOperations/CanvasDraw.tsx` (stub)
- `components/CanvasOperations/CanvasErase.tsx` (stub)
- `components/CanvasOperations/CanvasLocation.tsx` (stub)

### Modified files
- `App.tsx` — stripped demo widgets, wired `<HandTracking>` and `<Canvas>` via ref
- `gestures/GestureTypes.ts` — expanded to four states
- `components/HandTracking.tsx`:
  - Added `onFrame` prop with stable-ref pattern
  - Fires `onFrame(landmarks, stableGesture)` every frame when a hand is present
  - Fires `onFrame(null, NO_HAND)` when no hand detected
  - Pinned MediaPipe CDN version in `locateFile`
- `index.html` — pinned MediaPipe CDN version on the `<script>` tag

---

## WHY

### Layered canvas vs single canvas
A single canvas can't be both "persistent artwork" and "transient cursor."
Clear the canvas every frame and the artwork dies; preserve the artwork
and the cursor smears across the canvas. Two stacked `<canvas>` elements
let each behave correctly — the overlay clears every frame; the drawing
canvas accumulates strokes indefinitely.

### `activatedBy` vs `isActive`
The earlier `isActive` boolean required each op to check whether it
should run. That pushed control flow into every op (`if (!isActive)
return;`) and made the contract noisier than it needed to be. With
`activatedBy: GestureType` declared per op, the coordinator picks which
op to call — ops just *do their thing* without gatekeeping. Cleaner
separation of "deciding what runs" from "how it runs."

### CanvasLocation not implementing CanvasOp
Draw and Erase have a clear lifecycle: gesture starts → tick repeatedly →
gesture ends → reset state. Location has no such lifecycle — it's always
showing where the hand is, regardless of which gesture is active. Forcing
it into a start/end contract gave it no-op methods and an awkward
`activatedBy` value. Decoupling it keeps the contract honest: `CanvasOp`
is for drawing operations only; `CanvasLocation` is its own thing — a
cursor renderer.

### Four-state gesture vocab vs three
`NONE` was overloaded. It meant either "no hand visible" or "a hand is
visible but no specific gesture is recognized." Both states existed at
runtime but couldn't be distinguished. Splitting into `NO_HAND` and
`HAND_PRESENT` makes the cursor case ("hand is on screen, show pointer")
routable as its own gesture, and lets the canvas correctly clear the
overlay when the hand leaves the frame.

### Mirror flip in coords.ts
MediaPipe gives landmarks in normalized [0, 1] in the *original*
(unmirrored) camera frame. The webcam display is conventionally mirrored
so the user sees themselves like a mirror. Multiplying x by canvas width
directly would put drawings on the wrong side of where the user's hand
appears. The `(1 - x)` flip in `landmarkToCanvas` aligns drawn points
with the visible hand.

**Caveat:** see the `[GROUPMATE] double-mirror` issue. HandTracking
currently has two flips which cancel out, so the live display is *not*
actually mirrored. Once that's fixed, this alignment will work as
designed. The fix belongs in HandTracking.tsx, not in coords.ts.

### Pinning MediaPipe version
The unpinned CDN URL serves whatever jsdelivr considers `@latest`. The
main `hands.js` and the WASM sidecars are loaded at *different times*
during page initialization. If npm publishes a new version between those
two requests (or if the CDN cache invalidates one but not the other),
you get a JS shim calling into a WASM blob with an incompatible ABI.
That's what produced `Module.arguments has been replaced with plain
arguments_` — the modern WASM no longer exposes `Module.arguments`, but
the older JS shim was still calling for it. Pinning both URLs to the
same version string guarantees consistency.

### Why not migrate to @mediapipe/tasks-vision now?
It's the right strategic move — `@mediapipe/hands` is in maintenance
mode and the modern Tasks API is cleaner (single npm package, typed,
pinnable versions, synchronous `detectForVideo` instead of callback hell).
But the migration requires rewriting `HandTracking.tsx`, which is your
groupmate's territory. Pinning the version is a 60-second patch that
fixes the immediate error; the migration is a proper refactor that
should be coordinated with whoever owns that file.

When migration happens: your code under `gestures/`, `Models/`, and
`components/CanvasOperations/` does not need to change. The landmark
shape is identical (`{x, y, z}` normalized 0-1). Only `HandTracking.tsx`
and `index.html` are affected.

---

## REFERENCES

### MediaPipe (current — legacy Solutions API)
- **Hands solution docs** — https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/hands.md
  - Covers the `@mediapipe/hands` package currently loaded via CDN.
  - 21-landmark hand model, configuration options (`maxNumHands`,
    `modelComplexity`, `minDetectionConfidence`, `minTrackingConfidence`),
    and the legacy `onResults` callback API.
  - Reference this when tuning `hands.setOptions(...)` in
    `HandTracking.tsx`, or when looking up which landmark index
    corresponds to which knuckle/joint.

### MediaPipe (migration target — modern Tasks Vision API)
- **Gesture Recognizer docs** — https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer
  - Covers `@mediapipe/tasks-vision` — the actively maintained package
    that supersedes `@mediapipe/hands`.
  - Includes the built-in gesture classifier (Closed_Fist, Open_Palm,
    Pointing_Up, Thumb_Up, Thumb_Down, Victory, ILoveYou). Note: no
    PINCH category — see the `WHY` section on why we keep our custom
    detection pipeline rather than relying on the built-in classifier.
  - For our use case, `HandLandmarker` (landmarks only, no classifier)
    is the more direct migration target. The `gesture_recognizer` docs
    are still the best reference for the Tasks Vision setup pattern
    (`FilesetResolver`, `createFromOptions`, `detectForVideo`).
