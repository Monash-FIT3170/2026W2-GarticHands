# `@gartichands/server`

Express 5 + Socket.IO 4 back-end. Single file: `index.js`.

## Run

From `GarticHands/`:

```bash
npm run dev:server       # nodemon — auto-restarts
npm run start            # plain node
```

Defaults to port `3000`. Override with `PORT=4000 npm run dev:server`.

| Env var                   | Default | What it does                                                       |
| ------------------------- | ------- | ------------------------------------------------------------------ |
| `PORT`                    | `3000`  | HTTP + Socket.IO port.                                             |
| `PLAYER_TIMEOUT_SECONDS`  | `30`    | How long a player can go without polling before they're dropped.   |

## State

In-memory only. The `rooms` object maps `roomCode → Room`. Restart = data loss. There is no database yet by design.

Rooms are dropped a minute after their last player leaves, so an abandoned lobby doesn't leak. The delay is deliberate — it leaves room to rejoin after a misclick.

## Data shapes

```ts
type Player = {
  name: string
  status: 'host' | 'waiting' | 'ready'
  isHost: boolean
  ready: boolean
  joinedAt: number          // Date.now()
  lastSeen: number          // Date.now() of their most recent poll
}

type RoomPhase = 'lobby' | 'prompt' | 'draw' | 'guess' | 'reveal'

type Room = {
  code: string              // 6 chars, [A-Z0-9]
  players: Player[]
  status: 'waiting' | 'started'
  phase: RoomPhase
  round: number             // increments on each "Play Again"
  prompts: Record<string, string>   // playerName → prompt text
  drawings: Record<string, string>  // playerName → PNG data URL
  guesses: Record<string, string>   // playerName → guess text
  guessTargets: Record<string, string> // guesser name → drawer whose drawing they guessed
  createdAt: number
}
```

### Phase machine

```
lobby ──start──▶ prompt ──all-prompts-in──▶ draw ──all-drawings-in──▶ guess ──all-guesses-in──▶ reveal
                                                                                                  │
                                                                                          restart │
                                                                                                  ▼
                                                                                              prompt (round + 1)
```

Each submit endpoint advances the phase exactly once — when every player has submitted for the current phase. Submitting during the wrong phase returns `409`.

"Every player" means every player *still in the room*, so the same check runs again whenever someone leaves. Without that re-check a room would sit forever waiting on a contribution from a player who has gone.

## Presence

A room only works if its roster reflects who is actually still there, so departures are tracked two ways:

1. **Explicit** — the client calls `DELETE /rooms/:code/players/:name` from the "Leave Room" button, and again (with `keepalive`) when the tab is closing. This is the normal path and takes effect immediately.
2. **Timeout** — every player's `lastSeen` is stamped whenever they poll `GET /rooms/:code?playerName=…`. A sweep every 3 s drops anyone unheard-from for `PLAYER_TIMEOUT_SECONDS` (default 30). This is the safety net for crashes, closed laptops, and dead networks.

The timeout is deliberately much longer than the 1 s poll: browsers throttle timers in hidden tabs, and a backgrounded player is not a departed one.

**Any repeating poll must pass `?playerName=`** — a client that polls anonymously looks idle and gets dropped out of its own room.

When a player is removed the server:

- deletes their `prompts` / `drawings` / `guesses` / `guessTargets` entries,
- promotes the longest-standing remaining player to host if the leaver held that role (otherwise nobody could press Start),
- re-checks whether the phase is now complete and advances if so,
- emits `players-left` followed by `room-update`.

A client that finds itself missing from `room.players` has been dropped and sends the player back to the landing page.

## REST endpoints

All accept and return JSON. CORS is open to `http://localhost:5173` and `http://localhost:5137`.

### `GET /`

Health check.

```json
{ "message": "Gartic Hands server is running" }
```

### `POST /rooms/create`

Create a room. The creator becomes the host.

**Body**

```json
{ "hostName": "Alice" }
```

**Response 200**

```json
{ "success": true, "roomCode": "AB12CD", "room": { ... } }
```

### `POST /rooms/join`

Add a player to an existing room.

**Body**

```json
{ "roomCode": "AB12CD", "playerName": "Bob" }
```

**Response 200** `{ "success": true, "room": { ... } }`
**Response 400** missing fields.
**Response 404** room not found.

If the room has no host — everyone left and someone rejoined within the
empty-room grace window — the longest-standing player is promoted, so the lobby
always has someone who can press Start.

Also broadcasts `room-update` to room subscribers.

### `GET /rooms/:roomCode`

Fetch room state. The lobby polls this once per second.

**Query**

| Param        | Required | Purpose                                                                 |
| ------------ | -------- | ----------------------------------------------------------------------- |
| `playerName` | no       | Stamps that player's `lastSeen`. Pass it from every repeating poll — see [Presence](#presence). |

**Response 200** `{ "success": true, "room": { ... } }`
**Response 404** room not found.

### `DELETE /rooms/:roomCode/players/:playerName`

Remove a player from a room. Deletes their submissions, promotes a new host if
they were the host, and advances the phase if the remaining players have all
submitted.

**Response 200** `{ "success": true, "room": { ... } }`
**Response 404** room or player not found — including a second call for a player
who has already left.

Broadcasts `players-left` then `room-update`.

### `PATCH /rooms/:roomCode/ready`

Toggle a player's ready flag. No-op for the host (the host is always treated as ready).

**Body**

```json
{ "playerName": "Bob", "ready": true }
```

**Response 200** `{ "success": true, "room": { ... } }`
**Response 404** room or player not found.

Also broadcasts `room-update`.

### `PATCH /rooms/:roomCode/start`

Mark the room as `started`, set `phase = 'prompt'`, reset `prompts`/`drawings`/`guesses`. The lobby polls this transition and navigates players to `/input`.

**Response 200** `{ "success": true, "room": { ... } }`
**Response 404** room not found.

Broadcasts both `game-start` and `room-update`.

### `POST /rooms/:roomCode/prompts`

Record one player's prompt. Auto-advances `phase` to `'draw'` when every player has submitted.

**Body**

```json
{ "playerName": "Alice", "prompt": "a potato wearing a hat" }
```

**Response 200** `{ "success": true, "room": { ... } }`
**Response 400** invalid (empty prompt).
**Response 409** room is not in the `prompt` phase.
**Response 404** room or player not found.

Broadcasts `room-update`.

### `POST /rooms/:roomCode/drawings`

Record one player's drawing as a PNG data URL. Auto-advances `phase` to `'guess'` when every player has submitted. The body limit is `10mb`.

**Body**

```json
{ "playerName": "Alice", "dataUrl": "data:image/png;base64,iVBORw0KGgo..." }
```

**Response 200** `{ "success": true, "room": { ... } }`
**Response 400** payload is not a `data:image/...` URL.
**Response 409** room is not in the `draw` phase.
**Response 404** room or player not found.

Broadcasts `room-update`.

### `POST /rooms/:roomCode/guesses`

Record one player's guess. Auto-advances `phase` to `'reveal'` when every player has submitted.

**Body**

```json
{ "playerName": "Alice", "guess": "spud with a top hat", "of": "Bob" }
```

`of` (optional) names the drawer whose drawing the guess is about. It is stored
in `guessTargets` so the reveal can pair each guess with the right drawing even
if the roster changes mid-round.

**Response 200** `{ "success": true, "room": { ... } }`
**Response 409** room is not in the `guess` phase.
**Response 404** room or player not found.

Broadcasts `room-update`.

### `PATCH /rooms/:roomCode/restart`

Start a new round. Resets prompts/drawings/guesses, increments `round`, sets `phase = 'prompt'` and `status = 'started'`. Clients on `/game` (reveal) poll for this and navigate back to `/input`.

**Response 200** `{ "success": true, "room": { ... } }`
**Response 404** room not found.

Broadcasts `room-update`.

## Socket events

Connect over `http://localhost:3000`.

### Client → Server

| Event                | Payload                                                                              | Behavior                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `room-subscribe`     | `roomCode: string`                                                                   | Joins the socket to the room channel and replies with the latest `room-update`.                                |
| `hand-tracking-data` | `{ roomCode?: string, landmarks: HandLandmark[], gesture: GestureType }`             | Re-broadcast as `hand-tracking-update`. Room-scoped if `roomCode` is present; otherwise global broadcast.      |
| `drawing-event`      | `{ roomCode?: string, ...strokeData }`                                               | Re-broadcast as `drawing-update`. Same room-vs-global behavior.                                                |

### Server → Client

| Event                  | Payload          | Emitted when                                                                  |
| ---------------------- | ---------------- | ----------------------------------------------------------------------------- |
| `room-update`          | `Room`           | Any REST mutation that affects a room, plus on `room-subscribe`.              |
| `game-start`           | `Room`           | After `PATCH /rooms/:code/start`.                                             |
| `players-left`         | `{ code: string, names: string[] }` | One or more players left — explicitly or by presence timeout. Emitted just before the `room-update`. |
| `hand-tracking-update` | echo of input    | Forwarded from another player's `hand-tracking-data`.                         |
| `drawing-update`       | echo of input    | Forwarded from another player's `drawing-event`.                              |

## Adding an endpoint

1. Add the handler in `index.js`. Validate input, look up the room, mutate, respond.
2. If state changed, call `io.to(room.code).emit('room-update', room)` to push to subscribers.
3. Document above.

## Adding a socket event

1. Add a handler inside `io.on('connection', (socket) => { … })`.
2. Decide scope: room (`socket.to(code).emit(...)`) or global (`socket.broadcast.emit(...)`).
3. Document above with payload shape.

## Cross-references

- [`../ARCHITECTURE.md`](../ARCHITECTURE.md) — sequence diagrams, data flow.
- [`../client/README.md`](../client/README.md) — client side that consumes this API.
- [`../AGENTS.md`](../AGENTS.md) — agent rules and conventions.
