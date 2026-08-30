const express = require('express')
const http = require('http')
const cors = require('cors')
const { Server } = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5137'],
    methods: ['GET', 'POST'],
  },
})

const PORT = process.env.PORT || 3000
const MAX_ROUNDS = 4

const NEXT_PHASE = { prompt: 'draw', draw: 'guess', guess: 'reveal' }
const PHASE_BUCKET = { prompt: 'prompts', draw: 'drawings', guess: 'guesses' }

/**
 * A player whose client hasn't polled in this long is treated as gone. Generous
 * on purpose: leaving normally goes through `DELETE /rooms/:code/players/:name`,
 * so this only has to catch crashes, closed laptops, and dead networks. Browsers
 * also throttle timers in hidden tabs, and a backgrounded player is not a
 * departed one. Shorten it with `PLAYER_TIMEOUT_SECONDS` to exercise the sweep.
 */
const PLAYER_TIMEOUT_MS = (() => {
  const parsed = Number(process.env.PLAYER_TIMEOUT_SECONDS)
  return Number.isFinite(parsed) && parsed > 0 ? parsed * 1000 : 30000
})()

/** How often stale players are swept out of every room. */
const PRESENCE_SWEEP_MS = 3000

/** How long an emptied room is kept before it's dropped from memory. */
const EMPTY_ROOM_GRACE_MS = 60000

app.use(cors())
// PNG data URLs from the drawing canvas can be a few hundred KB; default is 100KB.
app.use(express.json({ limit: '10mb' }))

const rooms = {}

/** roomCode → epoch ms the room lost its last player. Kept off the room object. */
const emptySince = {}

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function makePlayer(name, isHost) {
  return {
    name,
    status: isHost ? 'host' : 'waiting',
    isHost,
    ready: isHost,
    joinedAt: Date.now(),
    lastSeen: Date.now(),
  }
}

/**
 * Hand the room to the longest-standing remaining player. Without this a lobby
 * whose host walked away has nobody who can press Start, and a finished round
 * has nobody who can start the next one.
 */
function promoteHost(room) {
  if (room.players.length === 0) return
  const next = room.players.reduce((a, b) => (a.joinedAt <= b.joinedAt ? a : b))
  next.isHost = true
  next.status = 'host'
  next.ready = true
}

/**
 * Drop a player and everything keyed by their name, promoting a new host if they
 * were holding that role. Returns whether the room actually changed.
 */
function removePlayer(room, playerName) {
  const index = room.players.findIndex((p) => p.name === playerName)
  if (index === -1) return false

  const [gone] = room.players.splice(index, 1)
  delete room.prompts[playerName]
  delete room.drawings[playerName]
  delete room.guesses[playerName]

  if (gone.isHost) promoteHost(room)
  return true
}

/**
 * Advance the phase if every *remaining* player has submitted. Called after each
 * submission and again after anyone leaves — otherwise the room sits forever
 * waiting on a contribution from someone who is no longer in it.
 */
function advanceIfPhaseComplete(room) {
  const bucket = PHASE_BUCKET[room.phase]
  if (!bucket || room.players.length === 0) return false

  const everyoneSubmitted = room.players.every(
    (p) => room[bucket][p.name] !== undefined && room[bucket][p.name] !== null,
  )
  if (!everyoneSubmitted) return false

  room.phase = NEXT_PHASE[room.phase]
  return true
}

/**
 * Shared tail for every departure, however it was detected. An emptied room is
 * marked for cleanup; otherwise the round is unblocked and the survivors are
 * told who is left.
 */
function afterPlayersLeft(room) {
  if (room.players.length === 0) {
    emptySince[room.code] = Date.now()
    return
  }

  delete emptySince[room.code]
  advanceIfPhaseComplete(room)
  io.to(room.code).emit('room-update', room)
}

/**
 * Presence sweep — the safety net behind the explicit leave endpoint. Removes
 * players who stopped polling and forgets rooms that nobody came back to.
 */
setInterval(() => {
  const now = Date.now()

  for (const code of Object.keys(rooms)) {
    const room = rooms[code]

    const stale = room.players.filter((p) => now - p.lastSeen > PLAYER_TIMEOUT_MS)
    if (stale.length > 0) {
      for (const p of stale) removePlayer(room, p.name)
      io.to(room.code).emit('players-left', {
        code: room.code,
        names: stale.map((p) => p.name),
      })
      afterPlayersLeft(room)
    }

    const emptiedAt = emptySince[code]
    if (emptiedAt && now - emptiedAt > EMPTY_ROOM_GRACE_MS) {
      delete rooms[code]
      delete emptySince[code]
    }
  }
}, PRESENCE_SWEEP_MS)

app.get('/', (_req, res) => {
  res.json({ message: 'Gartic Hands server is running' })
})

app.post('/rooms/create', (req, res) => {
  const { hostName } = req.body
  const roomCode = generateRoomCode()

  rooms[roomCode] = {
    code: roomCode,
    players: [makePlayer(hostName || 'Host', true)],
    status: 'waiting',
    phase: 'lobby',
    round: 1,
    maxRounds: MAX_ROUNDS,
    prompts: {},
    drawings: {},
    guesses: {},
    createdAt: Date.now(),
  }

  res.json({ success: true, roomCode, room: rooms[roomCode] })
})

app.post('/rooms/join', (req, res) => {
  const { roomCode, playerName } = req.body

  if (!roomCode || !playerName) {
    return res.status(400).json({
      success: false,
      message: 'Room code and player name are required',
    })
  }

  const room = rooms[roomCode.toUpperCase()]
  if (!room) {
    return res.status(404).json({ success: false, message: 'Room not found' })
  }

  room.players.push(makePlayer(playerName, false))
  delete emptySince[room.code]

  io.to(room.code).emit('room-update', room)
  res.json({ success: true, room })
})

app.get('/rooms/:roomCode', (req, res) => {
  const roomCode = req.params.roomCode.toUpperCase()
  const room = rooms[roomCode]
  if (!room) {
    return res.status(404).json({ success: false, message: 'Room not found' })
  }

  // Doubles as the presence heartbeat. Every in-game page already polls this
  // once per second, so identifying the caller costs no extra request — and a
  // player who stops polling is exactly the player who has gone.
  const { playerName } = req.query
  if (playerName) {
    const player = room.players.find((p) => p.name === playerName)
    if (player) player.lastSeen = Date.now()
  }

  res.json({ success: true, room })
})

/**
 * Leave a room. The client calls this from the "Leave Room" button and again,
 * best-effort, when the tab is closing.
 */
app.delete('/rooms/:roomCode/players/:playerName', (req, res) => {
  const roomCode = req.params.roomCode.toUpperCase()
  const room = rooms[roomCode]
  if (!room) {
    return res.status(404).json({ success: false, message: 'Room not found' })
  }

  const { playerName } = req.params
  if (!removePlayer(room, playerName)) {
    return res.status(404).json({ success: false, message: 'Player not found' })
  }

  io.to(room.code).emit('players-left', { code: room.code, names: [playerName] })
  afterPlayersLeft(room)
  res.json({ success: true, room })
})

app.patch('/rooms/:roomCode/ready', (req, res) => {
  const roomCode = req.params.roomCode.toUpperCase()
  const { playerName, ready: newReady } = req.body

  const room = rooms[roomCode]
  if (!room) {
    return res.status(404).json({ success: false, message: 'Room not found' })
  }

  const player = room.players.find((p) => p.name === playerName)
  if (!player) {
    return res.status(404).json({ success: false, message: 'Player not found' })
  }

  player.lastSeen = Date.now()

  if (!player.isHost) {
    player.ready = newReady
    player.status = newReady ? 'ready' : 'waiting'
  }

  io.to(room.code).emit('room-update', room)
  res.json({ success: true, room })
})

app.patch('/rooms/:roomCode/start', (req, res) => {
  const roomCode = req.params.roomCode.toUpperCase()
  const room = rooms[roomCode]
  if (!room) {
    return res.status(404).json({ success: false, message: 'Room not found' })
  }

  room.status = 'started'
  room.phase = 'prompt'
  room.round = 1
  room.prompts = {}
  room.drawings = {}
  room.guesses = {}
  io.to(room.code).emit('game-start', room)
  io.to(room.code).emit('room-update', room)
  res.json({ success: true, room })
})

app.patch('/rooms/:roomCode/restart', (req, res) => {
  const roomCode = req.params.roomCode.toUpperCase()
  const room = rooms[roomCode]
  if (!room) {
    return res.status(404).json({ success: false, message: 'Room not found' })
  }

  if ((room.round || 1) >= MAX_ROUNDS) {
    return res.status(409).json({
      success: false,
      message: `Cannot start round ${(room.round || 1) + 1} — max rounds is ${MAX_ROUNDS}. Use /end to return to the lobby.`,
      maxRounds: MAX_ROUNDS,
    })
  }

  room.status = 'started'
  room.phase = 'prompt'
  room.prompts = {}
  room.drawings = {}
  room.guesses = {}
  room.round = (room.round || 1) + 1
  io.to(room.code).emit('room-update', room)
  res.json({ success: true, room, maxRounds: MAX_ROUNDS })
})

app.patch('/rooms/:roomCode/end', (req, res) => {
  const roomCode = req.params.roomCode.toUpperCase()
  const room = rooms[roomCode]
  if (!room) {
    return res.status(404).json({ success: false, message: 'Room not found' })
  }

  room.status = 'waiting'
  room.phase = 'lobby'
  room.round = 1
  room.prompts = {}
  room.drawings = {}
  room.guesses = {}
  for (const p of room.players) {
    if (!p.isHost) {
      p.ready = false
      p.status = 'waiting'
    }
  }
  io.to(room.code).emit('room-update', room)
  res.json({ success: true, room })
})

function submitForPhase(roomCode, playerName, value, expectedPhase, validate) {
  const room = rooms[roomCode]
  if (!room) return { error: { status: 404, body: { success: false, message: 'Room not found' } } }

  const player = room.players.find((p) => p.name === playerName)
  if (!player) return { error: { status: 404, body: { success: false, message: 'Player not found' } } }

  if (room.phase !== expectedPhase) {
    return {
      error: {
        status: 409,
        body: { success: false, message: `Cannot submit during '${room.phase}' phase` },
      },
    }
  }

  if (validate && !validate(value)) {
    return { error: { status: 400, body: { success: false, message: 'Invalid submission' } } }
  }

  const bucket = PHASE_BUCKET[expectedPhase]
  room[bucket] = room[bucket] || {}
  room[bucket][playerName] = value
  player.lastSeen = Date.now()

  advanceIfPhaseComplete(room)

  io.to(room.code).emit('room-update', room)
  return { room }
}

app.post('/rooms/:roomCode/prompts', (req, res) => {
  const roomCode = req.params.roomCode.toUpperCase()
  const { playerName, prompt } = req.body
  const trimmed = (prompt || '').trim()

  const result = submitForPhase(
    roomCode,
    playerName,
    trimmed,
    'prompt',
    (v) => typeof v === 'string' && v.length > 0,
  )

  if (result.error) return res.status(result.error.status).json(result.error.body)
  res.json({ success: true, room: result.room })
})

app.post('/rooms/:roomCode/drawings', (req, res) => {
  const roomCode = req.params.roomCode.toUpperCase()
  const { playerName, dataUrl } = req.body

  const result = submitForPhase(
    roomCode,
    playerName,
    dataUrl || '',
    'draw',
    (v) => typeof v === 'string' && v.startsWith('data:image/'),
  )

  if (result.error) return res.status(result.error.status).json(result.error.body)
  res.json({ success: true, room: result.room })
})

app.post('/rooms/:roomCode/guesses', (req, res) => {
  const roomCode = req.params.roomCode.toUpperCase()
  const { playerName, guess } = req.body
  const trimmed = (guess || '').trim()

  const result = submitForPhase(
    roomCode,
    playerName,
    trimmed,
    'guess',
    (v) => typeof v === 'string',
  )

  if (result.error) return res.status(result.error.status).json(result.error.body)
  res.json({ success: true, room: result.room })
})

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id)

  socket.on('room-subscribe', (roomCode) => {
    if (!roomCode) return
    const code = roomCode.toUpperCase()
    socket.join(code)
    const room = rooms[code]
    if (room) socket.emit('room-update', room)
  })

  socket.on('hand-tracking-data', (data) => {
    if (data && data.roomCode) {
      socket.to(data.roomCode.toUpperCase()).emit('hand-tracking-update', data)
    } else {
      socket.broadcast.emit('hand-tracking-update', data)
    }
  })

  socket.on('drawing-event', (data) => {
    if (data && data.roomCode) {
      socket.to(data.roomCode.toUpperCase()).emit('drawing-update', data)
    } else {
      socket.broadcast.emit('drawing-update', data)
    }
  })

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id)
  })
})

server.listen(PORT, () => {
  console.log(`Gartic Hands server listening on http://localhost:${PORT}`)
})
