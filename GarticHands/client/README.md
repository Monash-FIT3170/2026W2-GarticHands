# `@gartichands/client`

React 19 + Vite 8 + TypeScript front-end for Gartic Hands.

## Run

From `GarticHands/`:

```bash
npm run dev:client      # vite on :5173
npm run build           # tsc -b && vite build → dist/
npm run lint            # ESLint
```

Or from this directory: `npm run dev`, `npm run build`, `npm run lint`. Either works (npm workspaces).

## Layout

```
src/
├── GarticHands.tsx      # <BrowserRouter> with all routes
├── main.tsx             # ReactDOM root
├── index.css            # Tailwind directives + Baloo 2 font
├── Pages/               # one file per route (see ARCHITECTURE.md for route table)
├── components/          # shared UI primitives (Card, Page, Button, …)
├── api/                 # REST helpers (room.ts) — server-bound fetches live here
├── assets/              # imported assets (hero.png, vite.svg, …)
└── drawing/             # MediaPipe hand-tracking + canvas modules (self-contained)
    ├── components/      # <HandTracking>, <Canvas>, CanvasOperations/
    ├── hooks/           # useHandTracking — webcam + landmark loop
    ├── gestures/        # GestureType enum + per-gesture detectors
    ├── Models/          # HandLandmark, Point
    ├── constants/       # handConnections (skeleton edges)
    └── utils/           # drawHand, gestureBuffer
public/
└── mediapipe-wasm/      # wasm + .task files loaded by @mediapipe/tasks-vision (don't move)
```

## Conventions

- **Routing** — every new route gets a `Pages/xxxPage.tsx` file and a `<Route>` entry in `GarticHands.tsx`.
- **API calls** — never `fetch` directly from a Page; add a typed helper to `api/room.ts` (or a sibling file).
- **Drawing code** — `drawing/` is dependency-free of game state; never import React Router or `api/` from inside it.
- **TypeScript** — `strict: true`. Use `import type` for type-only imports (`verbatimModuleSyntax` is on).
- **Styling** — Tailwind first. Custom CSS only when Tailwind can't express it.

## Hand-tracking quickstart

Drop the camera + canvas anywhere inside a `<DrawingProvider>` — the wiring is internal:

```tsx
import { DrawingProvider, DrawingCameraInput, DrawingCameraCanvas } from '../drawing'

function MyDrawingPage() {
  return (
    <DrawingProvider>
      <DrawingCameraInput />
      <DrawingCameraCanvas />
    </DrawingProvider>
  )
}
```

The two components communicate through context: `DrawingCameraInput` pushes hand-tracking frames, `DrawingCameraCanvas` consumes them. Pages don't manage refs or callbacks.

Lower-level `HandTracking`, `Canvas`, gesture detectors, and `useHandTracking` are still in `drawing/` but should be treated as internals of the public API exported from `drawing/index.ts`. Gesture-to-action mapping lives in `drawing/components/CanvasOperations/`.

## Adding a gesture

1. Detector: `drawing/gestures/detectors/detectFoo.ts` — exports `(landmarks: HandLandmark[]) => boolean`.
2. Enum: add `FOO: 'FOO'` to `GestureTypes.ts`.
3. Recognizer: extend `GestureRecogniser.TS` to call your detector.
4. Action: add `drawing/components/CanvasOperations/CanvasFoo.ts` implementing `CanvasOp` if it changes the canvas.
5. Dispatch: add a case in `Canvas.tsx`'s gesture switch.

## Cross-references

- [`../README.md`](../README.md) — top-level overview, packages, MVP status.
- [`../ARCHITECTURE.md`](../ARCHITECTURE.md) — diagrams + data shapes.
- [`../AGENTS.md`](../AGENTS.md) — agent-friendly rules and conventions.
- [`../server/README.md`](../server/README.md) — REST + Socket.IO API the client talks to.
