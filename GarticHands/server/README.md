# `@gartichands/server`

Express 5 + Socket.IO 4 back-end. Single file: `index.js`.

## Run

From `GarticHands/`:

```bash
npm run dev:server       # nodemon — auto-restarts
npm run start            # plain node
```

Defaults to port `3000`. Override with `PORT=4000 npm run dev:server`.

## State

In-memory only. The `rooms` object maps `roomCode → Room`. Restart = data loss. There is no database yet by design.

## Data shapes

```ts
type Player = {
  name: string
  status: 'host' | 'waiting' | 'ready'
  isHost: boolean
  ready: boolean
  joinedMidRound: boolean   // true = joined while a round was in progress; sits out until the next round
  joinedAt: number          // Date.now()
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

Each submit endpoint advances the phase exactly once — when every **active** player has submitted for the current phase. Players flagged `joinedMidRound: true` (they joined while `status === 'started'`) are not counted, so a late joiner can never stall the round. Their submissions are rejected with `409` until the flag is cleared, which happens whenever a fresh round begins (`/start`, `/restart`) or the room returns to the lobby (`/end`). Submitting during the wrong phase also returns `409`.

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

Add a player to an existing room. Joining is allowed **even after the game has started**: the player is added with `joinedMidRound: true`, sits out the round currently in progress (they don't gate phase advancement and can't submit), and becomes a full participant when the next round starts. The client detects `room.status === 'started'` in the response and routes the late joiner to the in-game waiting view instead of the lobby.

**Body**

```json
{ "roomCode": "AB12CD", "playerName": "Bob" }
```

**Response 200** `{ "success": true, "room": { ... } }`
**Response 400** missing fields.
**Response 404** room not found.

Also broadcasts `room-update` to room subscribers.

### `GET /rooms/:roomCode`

Fetch room state. The lobby polls this once per second.

**Response 200** `{ "success": true, "room": { ... } }`
**Response 404** room not found.

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

Mark the room as `started`, set `phase = 'prompt'`, reset `prompts`/`drawings`/`guesses`, and clear every player's `joinedMidRound` flag. The lobby polls this transition and navigates players to `/input`.

**Response 200** `{ "success": true, "room": { ... } }`
**Response 404** room not found.

Broadcasts both `game-start` and `room-update`.

### `POST /rooms/:roomCode/prompts`

Record one player's prompt. Auto-advances `phase` to `'draw'` when every active (non-mid-round-joiner) player has submitted.

**Body**

```json
{ "playerName": "Alice", "prompt": "a potato wearing a hat" }
```

**Response 200** `{ "success": true, "room": { ... } }`
**Response 400** invalid (empty prompt).
**Response 409** room is not in the `prompt` phase, or the player joined mid-round.
**Response 404** room or player not found.

Broadcasts `room-update`.

### `POST /rooms/:roomCode/drawings`

Record one player's drawing as a PNG data URL. Auto-advances `phase` to `'guess'` when every active (non-mid-round-joiner) player has submitted. The body limit is `10mb`.

**Body**

```json
{ "playerName": "Alice", "dataUrl": "data:image/png;base64,iVBORw0KGgo..." }
```

**Response 200** `{ "success": true, "room": { ... } }`
**Response 400** payload is not a `data:image/...` URL.
**Response 409** room is not in the `draw` phase, or the player joined mid-round.
**Response 404** room or player not found.

Broadcasts `room-update`.

### `POST /rooms/:roomCode/guesses`

Record one player's guess. Auto-advances `phase` to `'reveal'` when every active (non-mid-round-joiner) player has submitted.

**Body**

```json
{ "playerName": "Alice", "guess": "spud with a top hat" }
```

**Response 200** `{ "success": true, "room": { ... } }`
**Response 409** room is not in the `guess` phase, or the player joined mid-round.
**Response 404** room or player not found.

Broadcasts `room-update`.

### `PATCH /rooms/:roomCode/restart`

Start a new round. Resets prompts/drawings/guesses, increments `round`, sets `phase = 'prompt'` and `status = 'started'`, and clears every player's `joinedMidRound` flag — late joiners become full participants from this round. Clients on `/game` (reveal) poll for this and navigate back to `/input`.

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
