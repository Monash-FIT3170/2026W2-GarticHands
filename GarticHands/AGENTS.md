# AGENTS.md

Quick-start context for coding agents (Claude Code, Cursor, GitHub Copilot, Aider, Continue, OpenAI Codex, MCP-aware tools). Read this **first** when picking up the codebase. Everything here is intentionally concise — link out for depth.

## TL;DR

- **What**: Multiplayer drawing game; players draw with **webcam hand-tracking** (MediaPipe), others guess.
- **Stack**: TypeScript + React 19 + Vite 8 + Tailwind 3 on the client; Node 22 + Express 5 + Socket.IO 4 on the server.
- **Layout**: npm workspaces. Source lives under `GarticHands/client/` and `GarticHands/server/`. Old code preserved under `GarticHands/legacy/` — **read-only**, do not edit.
- **Run**: `cd GarticHands && npm install && npm run dev`.
- **State**: Lobby works. Round/drawing/guess loop is **stubbed** — see [`README.md` § MVP status](README.md#mvp-status).

## Where things live

| If you want to…                       | Look in                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------- |
| Add a route or page                   | `client/src/Pages/` + register in `client/src/GarticHands.tsx`            |
| Add or change a UI primitive          | `client/src/components/ui/` — see its own `README.md`                     |
| Embed the hand-tracking camera/canvas | `client/src/drawing/` — drop in `<DrawingCameraInput />` + `<DrawingCameraCanvas />` under a `<DrawingProvider>` |
| Modify hand-tracking behavior         | `client/src/drawing/hooks/useHandTracking.ts`                             |
| Add a new gesture                     | `client/src/drawing/gestures/detectors/` + extend `GestureTypes.ts`       |
| Change canvas drawing logic           | `client/src/drawing/components/CanvasOperations/`                         |
| Add a REST endpoint                   | `server/index.js` (Express app)                                           |
| Add a Socket.IO event                 | `server/index.js` (`io.on('connection', ...)`)                            |
| Call the server from React            | `client/src/api/room.ts`                                                  |
| Understand the data shapes            | [`ARCHITECTURE.md` § Data shapes](ARCHITECTURE.md#data-shapes-canonical) — and `client/src/types/room.ts` for the typed mirror |

## Hard rules

1. **Never edit anything under `GarticHands/legacy/`.** It exists for reference. If you need behavior from a legacy file, copy the relevant snippet into `client/src/` or `server/index.js` and update the rest of the new code to match.
2. **Don't reintroduce the old folder names** (`Frontend/`, `GarticHandsBackend/`, `drawing-input/`). All new code goes in `client/` or `server/`.
3. **Don't commit `node_modules/`.** The repo previously had thousands of tracked node_modules files; they were untracked during the consolidation. The new `.gitignore` covers this — keep it that way.
4. **Don't add a second `package-lock.json`.** npm workspaces use one lockfile at `GarticHands/package-lock.json`. Running `npm install` inside `client/` or `server/` will break this.
5. **Keep version drift out.** If you bump a dep version, pick the change carefully — `client/` and `server/` share transitive deps. Run `npm install` from `GarticHands/` after any version change.

## Conventions

### Imports

- React: `import { useState } from 'react'`
- Types: `import type { Foo } from './foo'` (the project uses `verbatimModuleSyntax`)
- Drawing code lives at `client/src/drawing/` — import as `../drawing/...` from `Pages/`.

### Naming

- Pages: `xxxPage.tsx`, default-exported as `XxxPage` (current code is inconsistent — match the file you're editing).
- API helpers: lowercase verb + noun (`createRoom`, `joinRoom`, `updateReady`).
- Server-side socket events: kebab-case (`hand-tracking-data`, `drawing-event`, `room-update`).
- Server-side REST: REST-ful nouns (`/rooms/:code`, `/rooms/:code/ready`).

### TypeScript

- `strict: true` is on. Don't use `any`; if you must, leave a `// TODO: type this properly` comment with reason.
- Avoid `as` casts except for `document.getElementById('root')!`-style escape hatches and DOM element types.
- Prefer `type` over `interface` for unions; `interface` for object props.

### State

- No global store yet (no Redux, no Zustand). Page-level `useState` + REST polling is the current pattern.
- When adding socket subscriptions, prefer a single top-level provider over per-page connections.

## What to read before writing code

| Task type                           | Read first                                                        |
| ----------------------------------- | ----------------------------------------------------------------- |
| Anything touching the game flow     | [`README.md` § MVP status](README.md#mvp-status), [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| Touching hand-tracking or canvas    | `client/src/drawing/components/Canvas.tsx`, `useHandTracking.ts`, `legacy/drawing-input/REVIEW.md` (known bugs) |
| Touching the server                 | [`server/README.md`](server/README.md), the whole `server/index.js` (it's one file)   |
| Touching auth or persistence        | There isn't any yet — design carefully and update `ARCHITECTURE.md` |

## How to verify your changes

```bash
cd GarticHands
npm run lint          # ESLint on client
npm run build         # tsc -b && vite build — catches type errors
npm run dev           # manual smoke test in two browser windows
```

There's no test suite yet. If you add one, put it in `client/src/__tests__/` (for client) or `server/__tests__/` (for server) and use Vitest for the client.

## Common gotchas

- **MediaPipe wasm**: the loader expects `/mediapipe-wasm/*` to be served from the Vite dev server. Files live in `client/public/mediapipe-wasm/`. Don't move them.
- **CORS**: the server allows origins `localhost:5173` and `localhost:5137` (the old drawing-input client port). Add new origins in `server/index.js`.
- **Port 3000**: hard-coded for the server. Set `PORT` env var to override.
- **Room codes are case-insensitive on the server** (`.toUpperCase()` everywhere) but **case-sensitive in routes** (`/joined/:code` is whatever the URL contains). The client uppercases before navigating.
- **Polling**: the lobby polls `GET /rooms/:code` every second. Don't add more polls — wire up Socket.IO first.
- **The poll is also the presence heartbeat**: always pass `?playerName=` from a repeating `getRoom` call. A client that polls anonymously looks idle and the server drops it out of its own room after 30s. See [`server/README.md` § Presence](server/README.md#presence).

## Glossary

- **Landmark** — a single (x, y, z) point on a hand. MediaPipe returns 21 of them.
- **Gesture** — one of `NO_HAND` / `HAND_PRESENT` / `PINCH` / `OPEN_PALM` derived from landmarks.
- **CanvasOp** — a strategy that consumes `(landmarks, gesture)` and mutates the canvas. One op per gesture.
- **Room** — server-side game session. In-memory. Identified by a 6-char code.
- **Phase** — a stage within a round: `lobby`, `prompt`, `draw`, `guess`, `reveal`. `prompt`/`draw`/`guess` run on a server-owned deadline (`room.phaseEndsAt`); the server force-advances when it passes. See [`ARCHITECTURE.md` § Phase deadlines](ARCHITECTURE.md#phase-deadlines).

## When in doubt

- Check the file you're editing for established patterns; copy them rather than inventing.
- The legacy folder is your context, not your codebase. Read it; don't extend it.
- If a change spans client + server, update [`ARCHITECTURE.md`](ARCHITECTURE.md) too.
