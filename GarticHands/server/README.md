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
  joinedAt: number          // Date.now()
}

type Room = {
  code: string              // 6 chars, [A-Z0-9]
  players: Player[]
  status: 'waiting' | 'started'
  createdAt: number
}
```

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

Mark the room as `started`. The lobby polls this transition and navigates players to `/input`.

**Response 200** `{ "success": true, "room": { ... } }`
**Response 404** room not found.

Also broadcasts `game-start`.

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
