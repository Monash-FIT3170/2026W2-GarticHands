# Architecture

How the pieces fit together. Written for humans **and** coding agents — every claim points to a file path.

## Top-down

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser                                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  React app  (client/src/)                                │   │
│  │  ┌────────────┐  ┌────────────────┐  ┌──────────────┐    │   │
│  │  │ Pages/     │  │ drawing/       │  │ api/room.ts  │    │   │
│  │  │ (routes)   │  │ (MediaPipe +   │  │ (REST calls) │    │   │
│  │  │            │  │  Canvas ops)   │  │              │    │   │
│  │  └────────────┘  └────────────────┘  └──────────────┘    │   │
│  │           ▲              ▲                   │            │   │
│  │           │ uses         │ webcam frames     │ fetch      │   │
│  │           └──────────────┘                   │            │   │
│  └──────────────────────────────────────────────│────────────┘   │
└────────────────────────────────────────────────│─────────────────┘
                                                 │
                                                 ▼  HTTP :3000
                                            ┌──────────────────────┐
                                            │  server/index.js     │
                                            │  Express 5 + Socket  │
                                            │  In-memory rooms{}   │
                                            └──────────────────────┘
                                                 ▲
                                                 │  Socket.IO :3000
                                                 │  (broadcasts)
                                            (not yet wired on client)
```

## Client routes (`client/src/GarticHands.tsx`)

| Path              | Component                          | Purpose                                            |
| ----------------- | ---------------------------------- | -------------------------------------------------- |
| `/`               | `Pages/landingPage.tsx`            | Pick "Host" or "Join"                              |
| `/host`           | `Pages/hostingPage.tsx`            | Create room, show lobby, start game                |
| `/join`           | `Pages/joiningPage.tsx`            | Enter name + room code                             |
| `/joined/:code`   | `Pages/joinedPage.tsx`             | Player lobby, ready toggle, auto-nav on start     |
| `/game`           | `Pages/gamePage.tsx`               | **Placeholder** — renders text only                |
| `/input`          | `Pages/inputPage.tsx`              | Write a prompt (server-timed phase)                |
| `/draw`           | `Pages/drawPage.tsx`               | Hand-tracking canvas (server-timed phase)          |
| `/guess`          | `Pages/guessingPage.tsx`           | Guess what was drawn (server-timed phase)          |

## Drawing subsystem (`client/src/drawing/`)

Borrowed verbatim from the legacy `drawing-input/client` spike.

```
drawing/
├── components/
│   ├── HandTracking.tsx           # <video> + landmark overlay
│   ├── Canvas.tsx                 # imperative-handle drawing surface
│   └── CanvasOperations/
│       ├── CanvasOps.ts           # Strategy interface
│       ├── CanvasDraw.ts          # PINCH → draw stroke
│       ├── CanvasErase.ts         # OPEN_PALM → erase region
│       └── CanvasLocation.ts      # HAND_PRESENT → preview cursor
├── hooks/
│   └── useHandTracking.ts         # MediaPipe Tasks Vision loader + frame loop
├── gestures/
│   ├── GestureTypes.ts            # NO_HAND | HAND_PRESENT | PINCH | OPEN_PALM
│   ├── GestureRecogniser.TS       # Pipes landmarks → gesture
│   ├── GestureUtils.ts            # Helpers
│   ├── coords.ts                  # Landmark <→ canvas-pixel transforms
│   └── detectors/
│       ├── detectHandOnScreen.ts
│       ├── detectOpenPalm.ts
│       └── detectPinch.ts
├── Models/
│   ├── HandLandmark.ts            # 21-point hand schema
│   └── Point.ts
├── constants/
│   └── handConnections.ts         # Skeleton edges for overlay drawing
└── utils/
    ├── drawHand.ts                # Render landmarks on a 2D context
    └── gestureBuffer.ts           # Smooths frame-to-frame gesture noise
```

**Flow**: `useHandTracking` opens `getUserMedia`, loads `@mediapipe/tasks-vision` from `public/mediapipe-wasm/`, runs detection per frame, calls `GestureRecogniser` on each landmark set, debounces through `gestureBuffer`, and emits `(landmarks, gesture)` to the parent via `onFrame`. `Canvas` consumes those frames and dispatches to one of the `CanvasOps` strategies based on gesture.

## Server (`server/index.js`)

Single file. Three responsibilities:

1. **Static REST** — see [`server/README.md`](server/README.md#rest-endpoints).
2. **In-memory state** — a `rooms` object keyed by 6-char alphanumeric room code. No persistence; restart = data loss. Intentional for now.
3. **Socket.IO broadcast hub** — events listed in [`server/README.md`](server/README.md#socket-events).

After any REST mutation that affects a room, the server emits `io.to(roomCode).emit('room-update', room)` so future socket-aware clients can drop the 1s polling.

## Data shapes (canonical)

These shapes live in the server file. Treat this section as the source of truth until they're extracted to a `shared/` package.

```ts
type Player = {
  name: string
  status: 'host' | 'waiting' | 'ready'
  isHost: boolean
  ready: boolean
  joinedMidRound: boolean // true = joined while a round was in progress
  joinedAt: number        // Date.now()
  lastSeen: number        // Date.now() of their most recent poll — see Presence below
}

type RoomPhase = 'lobby' | 'prompt' | 'draw' | 'guess' | 'reveal'

type Room = {
  code: string            // 6 chars, [A-Z0-9]
  players: Player[]
  status: 'waiting' | 'started'
  phase: RoomPhase
  phaseEndsAt: number | null   // epoch ms; null on the untimed phases
  round: number
  maxRounds: number
  prompts: Record<string, string>    // playerName → prompt text
  drawings: Record<string, string>   // playerName → PNG data URL
  guesses: Record<string, string>    // playerName → guess text
  guessTargets: Record<string, string> // guesserName → drawer whose drawing they guessed
  createdAt: number
}
```

`client/src/types/room.ts` is the typed mirror of these shapes — change both together.

## Phase deadlines

Every timed phase has a server-owned deadline. `prompt`, `draw`, and `guess` run for `PHASE_DURATIONS[phase]` seconds (60 by default, overridable per phase with the `PROMPT_SECONDS` / `DRAW_SECONDS` / `GUESS_SECONDS` env vars); `lobby` and `reveal` are untimed because the host paces them.

The server is the only clock that matters:

- `setPhase(room, phase)` in `server/index.js` stamps `room.phaseEndsAt` and arms a `setTimeout`. Every transition goes through it, so a deadline can never be stale and a timer can never outlive its phase.
- When the timer fires, missing submissions are filled in — a random `FALLBACK_PROMPTS` entry for the prompt phase, `''` for a drawing or a guess — and the room advances. One idle player can no longer stall everyone.
- Clients don't run their own clock. `GET /rooms/:code` returns `serverTime` alongside the room, and [`usePhaseAdvance`](client/src/hooks/usePhaseAdvance.ts) counts down `phaseEndsAt - serverTime`, so every player sees the same number regardless of browser clock skew.
- Clients still auto-submit at zero so in-progress work isn't discarded. The server waits an extra 1.5 s grace before forcing the advance, so that submit wins the race; if it doesn't, the `409` is treated as "too late, follow the room".

## Presence — leaving a room

The roster has to reflect who is *actually* still there, or one departure freezes everyone else: the lobby waits on a ready flag that will never arrive, and a round waits on a submission from an empty chair.

Departures are detected two ways, and both funnel into the same server-side path:

```
"Leave Room" button ─┐
tab close (keepalive)─┼─▶ DELETE /rooms/:code/players/:name ─┐
                      │                                       ├─▶ removePlayer()
presence sweep (3s) ──┴─▶ lastSeen older than 30s ────────────┘        │
                                                                       ▼
                                      delete their prompt/drawing/guess
                                      promote a new host if they held it
                                      advanceIfPhaseComplete(room)
                                      emit players-left + room-update
```

- **Heartbeat.** `GET /rooms/:code?playerName=…` stamps `lastSeen`. Every repeating poll on the client passes its player name, so presence rides on requests that were already happening — no extra traffic. A poll that omits the name looks like an absent player.
- **Host promotion.** The longest-standing remaining player takes over. `joinedPage` already renders host controls off `player.isHost`, so a promoted player sees the Start button on their next poll with no extra routing.
- **Phase re-check.** `advanceIfPhaseComplete()` runs after a departure as well as after a submission — that's what lets a round continue instead of stalling.
- **Being dropped.** A client that no longer finds itself in `room.players` returns to the landing page rather than sitting on a page it isn't part of.
- **Empty rooms** are forgotten a minute after their last player leaves.

## Late joins

`POST /rooms/join` succeeds even while `status === 'started'`. The new player gets `joinedMidRound: true`, which excludes them from the "everyone submitted" check that advances phases (a late joiner can never stall the round), from the deadline backfill when a phase times out (they owe no content), and blocks their own submissions with `409`. The flag is cleared when the next round starts (`/start`, `/restart`) or the room returns to the lobby (`/end`). The client routes a late joiner to `/game`, which shows a "round in progress" wait state and moves them into the game at the next round boundary. A late joiner who leaves again goes through the same `removePlayer` path as everyone else.

## Sequence: lobby + start (current)

```
Host                         Server                       Joiner
 │ POST /rooms/create ───────▶│                              │
 │◀──── 200 { roomCode, room }│                              │
 │                            │ POST /rooms/join ◀───────────│
 │                            │ ─── 200 { room } ───────────▶│
 │ GET /rooms/:code (poll 1s) │                              │
 │ GET /rooms/:code (poll 1s) │ ◀── GET /rooms/:code (poll) ─│
 │                            │                              │
 │                            │ PATCH /rooms/:code/ready ◀───│
 │ GET /rooms/:code           │                              │
 │  (sees joiner.ready=true)  │                              │
 │                            │                              │
 │ PATCH /rooms/:code/start ─▶│                              │
 │                            │ (next poll)                  │
 │                            │ ── 200 { status:'started' } ▶│
 │ navigate('/input')         │                              │ navigate('/input')
```

## Sequence: a round (intended, not yet implemented)

```
Player A (prompter)          Server                Player B (drawer)         Player C (guesser)
 │ submit prompt ───────────▶│                       │                          │
 │                           │── 'phase: draw' ─────▶│                          │
 │                           │                       │ draws via HandTracking   │
 │                           │◀── drawing-event ─────│ (per stroke)             │
 │                           │── drawing-update ────────────────────────────────▶│
 │                           │                       │ submit drawing ──────────│
 │                           │── 'phase: guess' ─────────────────────────────────▶│
 │                           │                       │                          │ submit guess
 │                           │── 'phase: reveal' ────▶│                          │
```

## Why npm workspaces?

- Single `npm install` from `GarticHands/` installs everything.
- Single `package-lock.json` — no version drift across sub-projects.
- `concurrently` script gives a one-command dev experience.
- Future shared code (types, validation schemas) lives in a sibling `shared/` workspace, imported by both client and server.
