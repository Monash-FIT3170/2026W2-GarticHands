# Gartic Hands

Multiplayer drawing-and-guessing game. Players draw prompts with their **hands in front of a webcam** (MediaPipe hand-tracking), other players guess what was drawn. Think *Gartic Phone* with no mouse/stylus.

> **Status**: monorepo consolidation in progress. Lobby flow works. Drawing + guessing routes exist but are not yet networked across players. See [MVP status](#mvp-status) below.

---

## Quickstart

```bash
cd GarticHands
npm install        # installs both workspaces
npm run dev        # runs server (:3000) + client (:5173) in one terminal
```

Open http://localhost:5173 in two browser windows to test the lobby flow.

**Prefer containers?** `docker compose up -d --build`, then open http://localhost:8080. Full guide: [`DOCKER.md`](DOCKER.md).

| Command              | What it does                                          |
| -------------------- | ----------------------------------------------------- |
| `npm run dev`        | Server (Express + Socket.IO) + client (Vite) together |
| `npm run dev:server` | Server only (`:3000`)                                 |
| `npm run dev:client` | Client only (`:5173`)                                 |
| `npm run build`      | Production build of the client                        |
| `npm run start`      | Server + Vite preview (production-mode client)        |
| `npm run lint`       | ESLint on the client                                  |

---

## Repository layout

```
GarticHands/
├── client/             # React + Vite + TypeScript front-end          (@gartichands/client)
│   ├── src/
│   │   ├── Pages/          # one file per route
│   │   ├── components/     # shared UI
│   │   ├── api/            # REST calls to server
│   │   └── drawing/        # MediaPipe hand-tracking + canvas modules
│   └── public/
│       └── mediapipe-wasm/ # required wasm blobs for tasks-vision
├── server/             # Express + Socket.IO back-end                  (@gartichands/server)
│   └── index.js
├── Training/           # spike materials and tutorial code (SpikeOne)
├── Gantt Chart/        # project planning artifact
├── legacy/             # original code preserved during merge (read-only)
│   ├── Frontend/
│   ├── GarticHandsBackend/
│   └── drawing-input/
├── ARCHITECTURE.md     # how the pieces fit together
├── AGENTS.md           # quick context for coding agents (Claude/Copilot/Cursor)
├── CONTRIBUTING.md     # dev workflow + conventions
└── package.json        # npm workspaces orchestrator
```

---

## MVP status

The intended game flow is:

```
Landing → Host/Join → Lobby → Prompt → Draw → Guess → Reveal ↺
   /        /host       /joined  /input   /draw  /guess  /game  (Play Again → /input)
            /join       :code
```

| Stage          | Route           | Status | Notes                                                                      |
| -------------- | --------------- | ------ | -------------------------------------------------------------------------- |
| Landing        | `/`             | ✅     | Pick host or join.                                                          |
| Hosting lobby  | `/host`         | ✅     | Creates room via REST, polls room state, host can start when all are ready. |
| Joining form   | `/join`         | ✅     | Submit name + room code.                                                    |
| Joined lobby   | `/joined/:code` | ✅     | Polls room, ready toggle, auto-navigates to `/input` on game start.         |
| Prompt entry   | `/input`        | ✅     | Each player writes a sentence. Auto-advances to `/draw` when all submit.    |
| Drawing        | `/draw`         | ✅     | MediaPipe hand-tracking canvas. Submits PNG to server; auto-advances to `/guess`. |
| Guessing       | `/guess`        | ✅     | Each player guesses another's drawing (cyclic). Auto-advances to `/game`.   |
| Reveal         | `/game`         | ✅     | Shows the prompt → drawing → guess chain for every player. Host can "Play Again" to start round N+1. |

### How it advances

The server holds the round state machine. Each submit endpoint (`/prompts`, `/drawings`, `/guesses`) records that player's contribution; when **every player** in the room has submitted, the server flips `room.phase` to the next phase and broadcasts `room-update`. Clients on the current page poll `GET /rooms/:code` once per second and navigate forward as soon as they see the new phase. The pattern is encapsulated in [`hooks/usePhaseAdvance.ts`](client/src/hooks/usePhaseAdvance.ts).

### Cyclic assignment

In `/guess`, player at index *i* sees the drawing of player at index *(i + 1) mod N*. The cycle is deterministic from the shared player-list order, so both clients agree on who guesses whose drawing without extra server coordination.

### Known limitations

1. **REST polling, not sockets.** Server already emits `room-update` over Socket.IO but the client doesn't subscribe yet. The 1s polling is the current substitute.
2. **In-memory rooms.** Server restart wipes the room — every poll will then 404.
3. **One round at a time.** "Play Again" increments `room.round` and restarts the loop, but no scoring or finals page exists.
4. **No reconnect.** Refreshing during a game loses `location.state` and bounces the player to `/`.

---

## Packages

All workspaces share one lockfile at `GarticHands/package-lock.json` thanks to npm workspaces hoisting. The versions below are the **highest of any version present** before the merge.

### `client/`

| Dependency                  | Version  | Used for                                          |
| --------------------------- | -------- | ------------------------------------------------- |
| `react`                     | ^19.2.6  | UI framework                                      |
| `react-dom`                 | ^19.2.6  | DOM renderer                                      |
| `react-router-dom`          | ^7.15.0  | Client-side routing                               |
| `@mediapipe/tasks-vision`   | ^0.10.35 | Hand-landmark detection (loaded from local wasm)  |

| Dev dependency                | Version   | Used for                            |
| ----------------------------- | --------- | ----------------------------------- |
| `vite`                        | ^8.0.13   | Dev server + build                  |
| `@vitejs/plugin-react`        | ^6.0.1    | Fast Refresh + JSX                  |
| `typescript`                  | ^6.0.3    | Type checking                       |
| `@types/react`                | ^19.2.14  | React types                         |
| `@types/react-dom`            | ^19.2.3   | DOM types                           |
| `@types/node`                 | ^24.12.0  | Node types (for `vite.config.ts`)   |
| `tailwindcss`                 | ^3.4.19   | Utility CSS                         |
| `postcss`                     | ^8.5.14   | CSS processing                      |
| `autoprefixer`                | ^10.5.0   | Vendor-prefix CSS                   |
| `eslint`                      | ^9.39.4   | Linter                              |
| `@eslint/js`                  | ^9.39.4   | ESLint base config                  |
| `typescript-eslint`           | ^8.57.0   | TS-aware ESLint                     |
| `eslint-plugin-react-hooks`   | ^7.0.1    | React-hooks rules                   |
| `eslint-plugin-react-refresh` | ^0.5.2    | Vite Fast Refresh rules             |
| `globals`                     | ^17.4.0   | ESLint globals                      |

### `server/`

| Dependency   | Version  | Used for                                |
| ------------ | -------- | --------------------------------------- |
| `express`    | ^5.2.1   | HTTP server + REST                      |
| `cors`       | ^2.8.6   | CORS for the Vite dev origin            |
| `socket.io`  | ^4.8.1   | Real-time sockets (broadcasting events) |

| Dev dependency | Version   | Used for                |
| -------------- | --------- | ----------------------- |
| `nodemon`      | ^3.1.14   | Auto-restart on changes |

### Root orchestrator

| Dev dependency | Version | Used for                                  |
| -------------- | ------- | ----------------------------------------- |
| `concurrently` | ^8.2.2  | Runs `client` + `server` together in dev  |

---

## Merge revisions (May 2026)

The repo previously contained several parallel projects with overlapping concerns. The merge consolidated them under `GarticHands/` and normalized package versions.

### What moved where

| Before                                  | After                                  |
| --------------------------------------- | -------------------------------------- |
| `Frontend/` (root)                      | `GarticHands/legacy/Frontend/`         |
| `GarticHandsBackend/` (root)            | `GarticHands/legacy/GarticHandsBackend/` |
| `drawing-input/` (root)                 | `GarticHands/legacy/drawing-input/`    |
| `Training/` (root)                      | `GarticHands/Training/`                |
| `Gantt Chart/` (root)                   | `GarticHands/Gantt Chart/`             |
| `GarticHands/` (Frontend code in root)  | `GarticHands/legacy/Frontend/`         |

### What was deleted

- Stray root `package.json` and `package-lock.json` that referenced a non-existent `index.js`.
- Committed `node_modules/` directories (~5,500 files) at the repo root, in `GarticHandsBackend/`, and in `Training/`. These are now properly gitignored.

### What was created

- **`GarticHands/client/`** — fresh Vite + React + TypeScript scaffold:
  - All Frontend pages and routing copied as the base (`Pages/`, `components/`, `api/`, `assets/`, `GarticHands.tsx`, `main.tsx`).
  - All drawing-input modules copied into `src/drawing/` (`components/`, `hooks/`, `gestures/`, `Models/`, `composables/`, `constants/`, `utils/`).
  - MediaPipe wasm blobs copied to `public/mediapipe-wasm/`.
  - **New** `Pages/drawPage.tsx` — wires up `<HandTracking>` + `<Canvas>` from the drawing modules, with a timer and submit button.
  - **New** `/draw` route added to `GarticHands.tsx`.
  - Two type-strict fixups: removed unused `GestureType` value import in `HandTracking.tsx`; typed `children: ReactNode` in `composables/Card.tsx`.

- **`GarticHands/server/`** — fresh Express + Socket.IO scaffold:
  - Merged the REST rooms API from the old `GarticHandsBackend` (`POST /rooms/create`, `POST /rooms/join`, `GET /rooms/:code`, `PATCH /rooms/:code/ready`, `PATCH /rooms/:code/start`) with the Socket.IO handlers from `drawing-input/server` (`hand-tracking-data`, `drawing-event`).
  - Added `room-subscribe` socket event so clients can join a room channel and receive scoped broadcasts.
  - All mutating REST endpoints now also emit `room-update` to the room's socket channel.

- **`GarticHands/package.json`** — npm workspaces orchestrator with `dev`, `build`, `start`, `lint` scripts.

### Package version normalization

Every package now uses the **highest version** found across the legacy projects. Notable bumps:

| Package           | Before (worst case)      | After     |
| ----------------- | ------------------------ | --------- |
| `typescript`      | `~5.9.3` (drawing-input) | `^6.0.3`  |
| `vite`            | `^8.0.1` (drawing-input) | `^8.0.13` |
| `react`           | `^19.2.4` (drawing-input)| `^19.2.6` |
| `express`         | `^4.18.2` (drawing-input)| `^5.2.1`  |
| `socket.io`       | `^4.7.2`                 | `^4.8.1`  |
| `tailwindcss`     | `^3.4.3` (Frontend)      | `^3.4.19` |
| `nodemon`         | `^3.0.1` (drawing-input) | `^3.1.14` |

### Verification done after the merge

- `npm install` — 356 packages, 0 vulnerabilities.
- `npm run build` — client production build succeeds.
- `npm run dev` — server listening on `:3000`, Vite ready on `:5173`.

---

## Further reading

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — how the modules fit together, request/event flow diagrams.
- [`DOCKER.md`](DOCKER.md) — run the whole stack in containers, with verification + troubleshooting.
- [`FORKING.md`](FORKING.md) — forkability seams and suggested prompts for future developers.
- [`AGENTS.md`](AGENTS.md) — quick context for LLM coding agents picking up the codebase.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — dev workflow, branching, commit conventions.
- [`client/README.md`](client/README.md) — front-end specifics.
- [`server/README.md`](server/README.md) — full REST + Socket.IO API reference.
- [`legacy/README.md`](legacy/README.md) — what's in legacy and why it's preserved.

---

## Team

See the [root README](../README.md) for the team roster.
