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
| `/input`          | `Pages/inputPage.tsx`              | Write a prompt (60s timer)                         |
| `/draw`           | `Pages/drawPage.tsx`               | Hand-tracking canvas (60s timer)                   |
| `/guess`          | `Pages/guessingPage.tsx`           | Guess what was drawn (60s timer)                   |

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
  joinedAt: number        // Date.now()
  lastSeen: number        // Date.now() of their most recent poll — see Presence below
}

type Room = {
  code: string            // 6 chars, [A-Z0-9]
  players: Player[]
  status: 'waiting' | 'started'
  createdAt: number
}
```

Drawings and prompts are **not yet modeled** server-side. Adding `prompts: string[]`, `drawings: DrawingFrame[]`, `currentRound: number`, `phase: 'prompt' | 'draw' | 'guess'` is the natural next extension.

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
