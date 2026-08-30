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

/** Env override — lets a demo or test run through a phase without waiting a full minute. */
function phaseSeconds(envName, fallback) {
  const parsed = Number(process.env[envName])
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

/**
 * Server-authoritative time limit, in seconds, for each timed phase. The server
 * owns the clock so every player counts down to the same instant and a slow or
 * disconnected player can't stall the round. `lobby` and `reveal` are absent on
 * purpose — the host paces those.
 */
const PHASE_DURATIONS = {
  prompt: phaseSeconds('PROMPT_SECONDS', 60),
  draw: phaseSeconds('DRAW_SECONDS', 60),
  guess: phaseSeconds('GUESS_SECONDS', 60),
}

/**
 * Extra time the server waits past `phaseEndsAt` before forcing the advance, so
 * a client that auto-submits exactly on the deadline still wins the race.
 */
const PHASE_GRACE_MS = 1500

const NEXT_PHASE = { prompt: 'draw', draw: 'guess', guess: 'reveal' }
const PHASE_BUCKET = { prompt: 'prompts', draw: 'drawings', guess: 'guesses' }

/**
 * Handed to players who run out of time in the `prompt` phase so the drawing
 * phase always has something to draw. Deliberately duplicated rather than shared
 * with `client/src/data/prompts.ts` — the server is plain CommonJS and must not
 * import client code.
 */
const FALLBACK_PROMPTS = [
  'a cat wearing a crown',
  'a rocket made of bananas',
  'a robot walking a dog',
  'a haunted teapot',
  'a penguin on a skateboard',
  'a tree growing lightbulbs',
  'a snail racing a train',
  'a castle floating on a cloud',
]

/** roomCode → Timeout. Kept out of the room object so rooms stay JSON-serialisable. */
const phaseTimers = {}

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

function makePlayer(name, isHost, joinedMidRound = false) {
  return {
    name,
    status: isHost ? 'host' : 'waiting',
    isHost,
    ready: isHost,
    joinedMidRound,
    joinedAt: Date.now(),
    lastSeen: Date.now(),
  }
}

/**
 * The players a phase is allowed to wait on: everyone currently in the room who
 * owes content this round. A player flagged `joinedMidRound` (late join) sits
 * the round out, so they neither block the advance nor get backfilled content.
 */
function activePlayers(room) {
  return room.players.filter((p) => !p.joinedMidRound)
}

function clearPhaseTimer(roomCode) {
  const timer = phaseTimers[roomCode]
  if (timer) {
    clearTimeout(timer)
    delete phaseTimers[roomCode]
  }
}

/**
 * Move a room into `phase`, stamp its deadline, and arm the forced advance.
 * Every phase transition must go through here — otherwise the room is left with
 * a stale `phaseEndsAt` or an orphaned timer firing into the next phase.
 */
function setPhase(room, phase) {
  clearPhaseTimer(room.code)
  room.phase = phase

  const duration = PHASE_DURATIONS[phase]
  if (!duration) {
    room.phaseEndsAt = null
    return
  }

  room.phaseEndsAt = Date.now() + duration * 1000
  phaseTimers[room.code] = setTimeout(
    () => expirePhase(room.code, phase),
    duration * 1000 + PHASE_GRACE_MS,
  )
}

/** What a player who never submitted gets recorded as when the deadline passes. */
function defaultSubmission(phase) {
  if (phase === 'prompt') {
    return FALLBACK_PROMPTS[Math.floor(Math.random() * FALLBACK_PROMPTS.length)]
  }
  // Draw and guess degrade to "nothing submitted" — the reveal screen renders
  // an empty drawing/guess rather than blocking the round.
  return ''
}

/**
 * Deadline handler: record a default for every player who never submitted, then
 * advance. Re-reads the room from `rooms` and re-checks the phase so a timer
 * that fires after an early advance (or after the room was reset) is a no-op.
 * Only active players are backfilled — anyone who left had their content
 * deleted by `removePlayer` and is no longer in the roster.
 */
function expirePhase(roomCode, expectedPhase) {
  delete phaseTimers[roomCode]

  const room = rooms[roomCode]
  if (!room || room.phase !== expectedPhase) return

  const bucket = PHASE_BUCKET[expectedPhase]
  room[bucket] = room[bucket] || {}
  for (const player of activePlayers(room)) {
    const submission = room[bucket][player.name]
    if (submission === undefined || submission === null) {
      room[bucket][player.name] = defaultSubmission(expectedPhase)
    }
  }

  setPhase(room, NEXT_PHASE[expectedPhase])
  io.to(room.code).emit('phase-timeout', { code: room.code, phase: expectedPhase })
  io.to(room.code).emit('room-update', room)
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
  if (room.guessTargets) delete room.guessTargets[playerName]

  if (gone.isHost) promoteHost(room)
  return true
}

/**
 * Advance the phase if every *remaining* active player has submitted. Called
 * after each submission and again after anyone leaves — otherwise the room sits
 * forever waiting on a contribution from someone who is no longer in it. The
 * advance goes through `setPhase`, which re-stamps `phaseEndsAt` and re-arms
 * (or, for untimed phases, clears) the deadline timer.
 */
function advanceIfPhaseComplete(room) {
  const bucket = PHASE_BUCKET[room.phase]
  if (!bucket) return false

  const active = activePlayers(room)
  if (active.length === 0) return false

  const everyoneSubmitted = active.every(
    (p) => room[bucket][p.name] !== undefined && room[bucket][p.name] !== null,
  )
  if (!everyoneSubmitted) return false

  setPhase(room, NEXT_PHASE[room.phase])
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
 * players who stopped polling and forgets rooms that nobody came back to. A
 * dropped room's phase timer is cleared with it so nothing fires into a room
 * that no longer exists.
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
      clearPhaseTimer(code)
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
    phaseEndsAt: null,
    round: 1,
    maxRounds: MAX_ROUNDS,
    prompts: {},
    drawings: {},
    guesses: {},
    guessTargets: {},
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

  // Joining a game that already started is allowed: the player is flagged as a
  // mid-round joiner so the current round can finish without waiting on them.
  // The flag is cleared when the next round starts (/start, /restart, /end).
  room.players.push(makePlayer(playerName, false, room.status === 'started'))
  delete emptySince[room.code]

  // A room can be rejoined after it emptied (within the grace window), at which
  // point nobody holds the host role — and a hostless lobby is deadlocked,
  // because only the host sees the Start button. Nothing else re-establishes a
  // host on join, so do it here whenever the role is vacant.
  if (!room.players.some((p) => p.isHost)) promoteHost(room)

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

  // `serverTime` lets the client rebase `phaseEndsAt` onto its own clock using
  // only server-side timestamps, so a skewed browser clock can't shift the
  // countdown. See `client/src/hooks/usePhaseAdvance.ts`.
  res.json({ success: true, room, serverTime: Date.now() })
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
  room.round = 1
  room.prompts = {}
  room.drawings = {}
  room.guesses = {}
  room.guessTargets = {}
  // Everyone present when the game starts is a full participant.
  for (const p of room.players) {
    p.joinedMidRound = false
  }
  setPhase(room, 'prompt')
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
  room.prompts = {}
  room.drawings = {}
  room.guesses = {}
  room.guessTargets = {}
  room.round = (room.round || 1) + 1
  // A new round starts — mid-round joiners become full participants.
  for (const p of room.players) {
    p.joinedMidRound = false
  }
  setPhase(room, 'prompt')
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
  room.round = 1
  room.prompts = {}
  room.drawings = {}
  room.guesses = {}
  room.guessTargets = {}
  setPhase(room, 'lobby')
  for (const p of room.players) {
    p.joinedMidRound = false
    if (!p.isHost) {
      p.ready = false
      p.status = 'waiting'
    }
  }
  io.to(room.code).emit('room-update', room)
  res.json({ success: true, room })
})

/**
 * Shared body of the three submit endpoints. `onAccepted`, when given, runs
 * after the submission is stored but before the phase-completion check and the
 * broadcast, so anything it records travels with the same `room-update`.
 */
function submitForPhase(roomCode, playerName, value, expectedPhase, validate, onAccepted) {
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

  if (player.joinedMidRound) {
    return {
      error: {
        status: 409,
        body: {
          success: false,
          message: 'You joined mid-round — you can play from the next round',
        },
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

  if (onAccepted) onAccepted(room, player)

  // Everyone active beat the clock — advance early; `advanceIfPhaseComplete`
  // counts only active players (mid-round joiners don't owe content this
  // round) and `setPhase` inside re-arms the next deadline (or clears it when
  // the next phase is untimed).
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
  const { playerName, guess, of } = req.body
  const trimmed = (guess || '').trim()

  const result = submitForPhase(
    roomCode,
    playerName,
    trimmed,
    'guess',
    (v) => typeof v === 'string',
    (room) => {
      // Record whose drawing this guess was about. The reveal pairs guesses
      // with drawings through this map rather than roster index math, which
      // would shift every pairing whenever someone left mid-round.
      if (typeof of === 'string' && of.length > 0) {
        room.guessTargets = room.guessTargets || {}
        room.guessTargets[playerName] = of
      }
    },
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
