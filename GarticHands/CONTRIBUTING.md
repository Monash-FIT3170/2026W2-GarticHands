# Contributing

Practical guide for forking, branching, and shipping changes.

## Prerequisites

- **Node 22.x** (tested with v22.18.0).
- **npm 11.x** (tested with 11.12.0).
- A webcam, if you want to test the drawing flow.

## First-time setup

```bash
git clone https://github.com/Monash-FIT3170/2026W2-GarticHands.git
cd 2026W2-GarticHands/GarticHands
npm install                  # one install for both workspaces
npm run dev                  # server :3000 + client :5173
```

Open http://localhost:5173 in two browser windows or tabs to test multiplayer interactions.

## Day-to-day commands

All run from `GarticHands/`:

```bash
npm run dev                  # server + client together
npm run dev:client           # client only
npm run dev:server           # server only
npm run build                # production client build → client/dist/
npm run start                # server + Vite preview
npm run lint                 # ESLint over the client
```

## Branching

We loosely follow trunk-based development off `dev`:

```
main            ← release / stable
  ↑
dev             ← integration branch (PR target)
  ↑
feat/short-name ← your work
fix/short-name
chore/short-name
```

Naming convention: `<kind>/<short-kebab>`. Keep branches scoped to one concern.

## Commit conventions

Loosely Conventional Commits. Prefixes that show up in this repo:

- `feat:` new user-facing capability
- `fix:` bug fix
- `refactor:` no behavior change
- `chore:` tooling, configs, docs
- `docs:` documentation only
- `test:` test only

Examples from the existing history:
```
feat: add styling to landing page
fix: move logo and top-right-button to their own component files
refactor: migrate HandTracking to tasks-vision and split into focused modules
```

## Pull requests

1. Branch from `dev`.
2. Open the PR against `dev`.
3. Fill in a one-paragraph summary + a test plan checklist.
4. Make sure `npm run build` passes locally — there is no CI yet.
5. Squash on merge unless the commit history meaningfully tells a story.

## Code style

- TypeScript `strict: true` is enforced. Don't introduce `any` without a comment explaining why.
- React: functional components only. No class components.
- Two-space indent. Semicolons optional but be consistent within a file.
- Prefer named exports for utilities; default exports for Pages and React components match the existing pattern.
- Tailwind classes inline; don't add bespoke CSS unless animations or pseudo-selectors require it.

## Adding a new page

1. Create `client/src/Pages/myPage.tsx` exporting a React component.
2. Register the route in `client/src/GarticHands.tsx`:
   ```tsx
   import MyPage from './Pages/myPage.tsx'
   // …
   <Route path='/my-page' element={<MyPage />} />
   ```
3. If the page calls the server, add the function to `client/src/api/room.ts` (or a new sibling file).

## Adding a server endpoint

1. Add the handler in `server/index.js`. Follow the existing pattern (validate, look up room, mutate, broadcast).
2. After any state-mutating endpoint, call `io.to(room.code).emit('room-update', room)` so future socket-aware clients react.
3. Document the endpoint in [`server/README.md`](server/README.md).

## Adding a Socket.IO event

1. Add the handler inside the `io.on('connection', ...)` block in `server/index.js`.
2. Decide: room-scoped (`socket.to(code).emit(...)`) or global (`socket.broadcast.emit(...)`).
3. Document the event in [`server/README.md`](server/README.md#socket-events) with payload shape.

## Working with the drawing subsystem

Anything under `client/src/drawing/` is treated as a self-contained module. Don't import React-router or game-flow code into it — keep it usable from any page.

Adding a new gesture:

1. Add a detector in `client/src/drawing/gestures/detectors/detectMyGesture.ts` exporting a `(landmarks) => boolean` function.
2. Register it in `gestures/GestureTypes.ts` and `gestures/GestureRecogniser.TS`.
3. Add a matching `CanvasOp` strategy in `client/src/drawing/components/CanvasOperations/` if it should draw something.
4. Hook the strategy into `Canvas.tsx`'s gesture-dispatch switch.

## Working with the legacy folder

`GarticHands/legacy/` contains the pre-merge versions of Frontend, GarticHandsBackend, and drawing-input. It is **read-only**:

- Don't `npm install` inside legacy folders.
- Don't add new code there.
- Don't import from `legacy/` in `client/` or `server/`.
- Copy snippets over if you need behavior — don't reference.

See [`legacy/README.md`](legacy/README.md) for the full inventory.

## Reporting issues

File issues at https://github.com/Monash-FIT3170/2026W2-GarticHands/issues. Include:

- What you tried (`npm run dev`, navigating to a route, etc.)
- What you expected
- What you saw (error message + stack trace if any)
- Browser + OS

## Coding agents (Claude / Cursor / Copilot / etc.)

Read [`AGENTS.md`](AGENTS.md) before generating code in this repo. It lists hard rules, conventions, and common gotchas in a format optimized for LLM context windows.
