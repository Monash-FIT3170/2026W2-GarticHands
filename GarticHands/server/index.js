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
const MAX_PLAYERS = 8

/** Env override — lets a demo or test run through a phase without waiting a full minute. */
function phaseSeconds(envName, fallback) {
  const parsed = Number(process.env[envName])
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

/**
 * Server-authoritative time limit, in seconds, for each timed phase.
 * Untimed phases are host-paced.
 */
const PHASE_DURATIONS = {
  prompt: phaseSeconds('PROMPT_SECONDS', 60),
  draw: phaseSeconds('DRAW_SECONDS', 60),
  guess: phaseSeconds('GUESS_SECONDS', 60),
  rating: phaseSeconds('RATING_SECONDS', 60),
}

/**
 * Extra time the server waits past phaseEndsAt before forcing the advance,
 * so a client that auto-submits exactly on the deadline still wins the race.
 */
const PHASE_GRACE_MS = 1500

/**
 * Classic:
 * prompt -> draw -> guess -> reveal
 *
 * Leaderboard:
 * prompt -> draw -> rating -> ratingReveal -> leaderboard
 */
const NEXT_PHASE = {
  prompt: 'draw',
  draw: 'guess',
  guess: 'reveal',
  rating: 'ratingReveal',
}

const PHASE_BUCKET = {
  prompt: 'prompts',
  draw: 'drawings',
  guess: 'guesses',
  rating: 'ratings',
}

/**
 * Handed to players who run out of time in the prompt phase so the drawing
 * phase always has something to draw.
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

/** roomCode -> Timeout. Kept out of the room object so rooms stay JSON-serialisable. */
const phaseTimers = {}

/**
 * A player whose client hasn't polled in this long is treated as gone.
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

// PNG data URLs from the drawing canvas can be a few hundred KB.
app.use(express.json({ limit: '10mb' }))

const rooms = {}

/** roomCode -> epoch ms the room lost its last player. */
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
 * The players a phase is allowed to wait on.
 *
 * Players who joined during an active round sit that round out and become
 * participants when the next round starts.
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
 * Move a room into a phase, stamp its deadline and arm the forced advance.
 *
 * Every phase transition goes through this function.
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

/**
 * What a player who never submitted gets recorded as when the deadline passes.
 */
function defaultSubmission(phase) {
  if (phase === 'prompt') {
    return FALLBACK_PROMPTS[
      Math.floor(Math.random() * FALLBACK_PROMPTS.length)
    ]
  }

  if (phase === 'rating') {
    return 0
  }

  // Draw and guess degrade to "nothing submitted".
  return ''
}

/**
 * Create the rating assignment for the current round.
 *
 * Every active player rates exactly one other active player's drawing.
 * Every active player receives exactly one rating.
 *
 * The offset changes each round so players are not repeatedly assigned
 * the same target where possible.
 */
function createRatingTargets(room) {
  const players = activePlayers(room)

  room.ratingTargets = {}

  if (players.length < 2) {
    return
  }

  /*
   * Offset is always between 1 and players.length - 1.
   *
   * This gives:
   * 3 players:
   * round 1 -> next player
   * round 2 -> player after next
   *
   * and works for both even and odd player counts.
   */
  const offset =
    ((room.round - 1) % (players.length - 1)) + 1

  players.forEach((player, index) => {
    const targetIndex = (index + offset) % players.length
    room.ratingTargets[player.name] = players[targetIndex].name
  })
}

/**
 * Move from drawing to the Leaderboard rating phase.
 *
 * Rating assignments are created here, rather than earlier in the round,
 * so they are based on the players who actually made it to the rating phase.
 */
function startRatingPhase(room) {
  createRatingTargets(room)
  setPhase(room, 'rating')
}

/**
 * Deadline handler.
 *
 * Timed phases are automatically completed with default submissions.
 */
function expirePhase(roomCode, expectedPhase) {
  delete phaseTimers[roomCode]

  const room = rooms[roomCode]

  if (!room || room.phase !== expectedPhase) {
    return
  }

  const bucket = PHASE_BUCKET[expectedPhase]

  if (!bucket) {
    return
  }

  room[bucket] = room[bucket] || {}

  for (const player of activePlayers(room)) {
    const submission = room[bucket][player.name]

    if (submission === undefined || submission === null) {
      room[bucket][player.name] = defaultSubmission(expectedPhase)
    }
  }

  if (room.mode === 'leaderboard' && expectedPhase === 'draw') {
    startRatingPhase(room)
  } else {
    setPhase(room, NEXT_PHASE[expectedPhase])
  }

  io.to(room.code).emit('phase-timeout', {
    code: room.code,
    phase: expectedPhase,
  })

  io.to(room.code).emit('room-update', room)
}

/**
 * Hand the room to the longest-standing remaining player.
 */
function promoteHost(room) {
  if (room.players.length === 0) {
    return
  }

  const next = room.players.reduce((a, b) =>
    a.joinedAt <= b.joinedAt ? a : b,
  )

  next.isHost = true
  next.status = 'host'
  next.ready = true
}

/**
 * Drop a player and everything keyed by their name.
 */
function removePlayer(room, playerName) {
  const index = room.players.findIndex((p) => p.name === playerName)

  if (index === -1) {
    return false
  }

  const [gone] = room.players.splice(index, 1)

  delete room.prompts[playerName]
  delete room.drawings[playerName]
  delete room.guesses[playerName]
  delete room.ratings[playerName]

  if (room.guessTargets) {
    delete room.guessTargets[playerName]
  }

  if (room.ratingTargets) {
    delete room.ratingTargets[playerName]
  }

  if (gone.isHost) {
    promoteHost(room)
  }

  return true
}

/**
 * Advance a timed submission phase when every remaining active player
 * has submitted.
 */
function advanceIfPhaseComplete(room) {
  const bucket = PHASE_BUCKET[room.phase]

  if (!bucket) {
    return false
  }

  const active = activePlayers(room)

  if (active.length === 0) {
    return false
  }

  const everyoneSubmitted = active.every(
    (p) =>
      room[bucket][p.name] !== undefined &&
      room[bucket][p.name] !== null,
  )

  if (!everyoneSubmitted) {
    return false
  }

  if (room.mode === 'leaderboard' && room.phase === 'draw') {
    startRatingPhase(room)
  } else {
    setPhase(room, NEXT_PHASE[room.phase])
  }

  return true
}

/**
 * Shared tail for every departure.
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
 * Presence sweep.
 */
setInterval(() => {
  const now = Date.now()

  for (const code of Object.keys(rooms)) {
    const room = rooms[code]

    const stale = room.players.filter(
      (p) => now - p.lastSeen > PLAYER_TIMEOUT_MS,
    )

    if (stale.length > 0) {
      for (const p of stale) {
        removePlayer(room, p.name)
      }

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

/**
 * Create a room.
 *
 * `mode` is optional so existing clients still create Classic rooms.
 *
 * `maxRounds` is also optional for future round-selector work, but currently
 * defaults to the existing MAX_ROUNDS value. We deliberately do not change
 * the current round-selector implementation here.
 */
app.post('/rooms/create', (req, res) => {
  const { hostName, mode, maxRounds } = req.body

  const roomCode = generateRoomCode()

  const selectedMode =
    mode === 'leaderboard' ? 'leaderboard' : 'classic'

  const selectedMaxRounds =
    Number.isInteger(maxRounds) && maxRounds > 0
      ? maxRounds
      : MAX_ROUNDS

  rooms[roomCode] = {
    code: roomCode,
    players: [makePlayer(hostName || 'Host', true)],
    status: 'waiting',
    mode: selectedMode,
    phase: 'lobby',
    phaseEndsAt: null,

    round: 1,
    maxRounds: selectedMaxRounds,

    prompts: {},
    drawings: {},

    // Classic
    guesses: {},
    guessTargets: {},

    // Leaderboard
    ratings: {},
    ratingTargets: {},
    scores: {},

    createdAt: Date.now(),
  }

  res.json({
    success: true,
    roomCode,
    room: rooms[roomCode],
  })
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
    return res.status(404).json({
      success: false,
      message: 'Room not found',
    })
  }

  if (room.players.length >= MAX_PLAYERS) {
    return res.status(409).json({
      success: false,
      message: `Room is full (${MAX_PLAYERS} players maximum).`,
    })
  }

  room.players.push(
    makePlayer(
      playerName,
      false,
      room.status === 'started',
    ),
  )

  delete emptySince[room.code]

  if (!room.players.some((p) => p.isHost)) {
    promoteHost(room)
  }

  io.to(room.code).emit('room-update', room)

  res.json({
    success: true,
    room,
  })
})

app.get('/rooms/:roomCode', (req, res) => {
  const roomCode = req.params.roomCode.toUpperCase()
  const room = rooms[roomCode]

  if (!room) {
    return res.status(404).json({
      success: false,
      message: 'Room not found',
    })
  }

  const { playerName } = req.query

  if (playerName) {
    const player = room.players.find(
      (p) => p.name === playerName,
    )

    if (player) {
      player.lastSeen = Date.now()
    }
  }

  res.json({
    success: true,
    room,
    serverTime: Date.now(),
  })
})

/**
 * Leave a room.
 */
app.delete('/rooms/:roomCode/players/:playerName', (req, res) => {
  const roomCode = req.params.roomCode.toUpperCase()
  const room = rooms[roomCode]

  if (!room) {
    return res.status(404).json({
      success: false,
      message: 'Room not found',
    })
  }

  const { playerName } = req.params

  if (!removePlayer(room, playerName)) {
    return res.status(404).json({
      success: false,
      message: 'Player not found',
    })
  }

  io.to(room.code).emit('players-left', {
    code: room.code,
    names: [playerName],
  })

  afterPlayersLeft(room)

  res.json({
    success: true,
    room,
  })
})

app.patch('/rooms/:roomCode/ready', (req, res) => {
  const roomCode = req.params.roomCode.toUpperCase()
  const { playerName, ready: newReady } = req.body

  const room = rooms[roomCode]

  if (!room) {
    return res.status(404).json({
      success: false,
      message: 'Room not found',
    })
  }

  const player = room.players.find(
    (p) => p.name === playerName,
  )

  if (!player) {
    return res.status(404).json({
      success: false,
      message: 'Player not found',
    })
  }

  player.lastSeen = Date.now()

  if (!player.isHost) {
    player.ready = newReady
    player.status = newReady ? 'ready' : 'waiting'
  }

  io.to(room.code).emit('room-update', room)

  res.json({
    success: true,
    room,
  })
})

/**
 * Start a game.
 *
 * Classic requires at least 3 players.
 * Leaderboard requires at least 2 players.
 */
app.patch('/rooms/:roomCode/start', (req, res) => {
  const roomCode = req.params.roomCode.toUpperCase()
  const room = rooms[roomCode]

  if (!room) {
    return res.status(404).json({
      success: false,
      message: 'Room not found',
    })
  }

  const playerCount = room.players.length

  if (room.mode === 'classic' && playerCount < 3) {
    return res.status(409).json({
      success: false,
      message: 'Classic Mode needs at least 3 players to start.',
      code: 'CLASSIC_MIN_PLAYERS',
      minPlayers: 3,
    })
  }

  if (room.mode === 'leaderboard' && playerCount < 2) {
    return res.status(409).json({
      success: false,
      message: 'Leaderboard Mode needs at least 2 players to start.',
      code: 'LEADERBOARD_MIN_PLAYERS',
      minPlayers: 2,
    })
  }

  room.status = 'started'
  room.round = 1

  room.prompts = {}
  room.drawings = {}

  // Classic
  room.guesses = {}
  room.guessTargets = {}

  // Leaderboard
  room.ratings = {}
  room.ratingTargets = {}
  room.scores = {}

  for (const p of room.players) {
    p.joinedMidRound = false
  }

  setPhase(room, 'prompt')

  io.to(room.code).emit('game-start', room)
  io.to(room.code).emit('room-update', room)

  res.json({
    success: true,
    room,
  })
})

/**
 * Start the next round.
 *
 * We deliberately use room.maxRounds instead of the hard-coded MAX_ROUNDS
 * here so future round-selector changes automatically work with Leaderboard.
 */
app.patch('/rooms/:roomCode/restart', (req, res) => {
  const roomCode = req.params.roomCode.toUpperCase()
  const room = rooms[roomCode]

  if (!room) {
    return res.status(404).json({
      success: false,
      message: 'Room not found',
    })
  }

  if ((room.round || 1) >= room.maxRounds) {
    return res.status(409).json({
      success: false,
      message: `Cannot start round ${(room.round || 1) + 1} — max rounds is ${room.maxRounds}. Use /end to return to the lobby.`,
      maxRounds: room.maxRounds,
    })
  }

  room.status = 'started'

  room.prompts = {}
  room.drawings = {}

  // Classic
  room.guesses = {}
  room.guessTargets = {}

  // Leaderboard
  room.ratings = {}
  room.ratingTargets = {}

  room.round = (room.round || 1) + 1

  // A new round starts — mid-round joiners become full participants.
  for (const p of room.players) {
    p.joinedMidRound = false
  }

  setPhase(room, 'prompt')

  io.to(room.code).emit('room-update', room)

  res.json({
    success: true,
    room,
    maxRounds: room.maxRounds,
  })
})

/**
 * End the current game and return to the lobby.
 *
 * Scores are cleared because this starts a fresh game.
 */
app.patch('/rooms/:roomCode/end', (req, res) => {
  const roomCode = req.params.roomCode.toUpperCase()
  const room = rooms[roomCode]

  if (!room) {
    return res.status(404).json({
      success: false,
      message: 'Room not found',
    })
  }

  room.status = 'waiting'
  room.round = 1

  room.prompts = {}
  room.drawings = {}

  // Classic
  room.guesses = {}
  room.guessTargets = {}

  // Leaderboard
  room.ratings = {}
  room.ratingTargets = {}
  room.scores = {}

  setPhase(room, 'lobby')

  for (const p of room.players) {
    p.joinedMidRound = false

    if (!p.isHost) {
      p.ready = false
      p.status = 'waiting'
    }
  }

  io.to(room.code).emit('room-update', room)

  res.json({
    success: true,
    room,
  })
})

/**
 * Move a Leaderboard room from the rating reveal to its leaderboard page.
 *
 * The rating reveal is deliberately untimed so players can see their results
 * before the host moves everyone to the leaderboard.
 */
app.patch('/rooms/:roomCode/rating-reveal', (req, res) => {
  const roomCode = req.params.roomCode.toUpperCase()
  const room = rooms[roomCode]

  if (!room) {
    return res.status(404).json({
      success: false,
      message: 'Room not found',
    })
  }

  if (
    room.mode !== 'leaderboard' ||
    room.phase !== 'ratingReveal'
  ) {
    return res.status(409).json({
      success: false,
      message: `Cannot show leaderboard during '${room.phase}' phase`,
    })
  }

  setPhase(room, 'leaderboard')

  io.to(room.code).emit('room-update', room)

  res.json({
    success: true,
    room,
  })
})

/**
 * Shared body of submission endpoints.
 */
function submitForPhase(
  roomCode,
  playerName,
  value,
  expectedPhase,
  validate,
  onAccepted,
) {
  const room = rooms[roomCode]

  if (!room) {
    return {
      error: {
        status: 404,
        body: {
          success: false,
          message: 'Room not found',
        },
      },
    }
  }

  const player = room.players.find(
    (p) => p.name === playerName,
  )

  if (!player) {
    return {
      error: {
        status: 404,
        body: {
          success: false,
          message: 'Player not found',
        },
      },
    }
  }

  if (room.phase !== expectedPhase) {
    return {
      error: {
        status: 409,
        body: {
          success: false,
          message: `Cannot submit during '${room.phase}' phase`,
        },
      },
    }
  }

  if (player.joinedMidRound) {
    return {
      error: {
        status: 409,
        body: {
          success: false,
          message:
            'You joined mid-round — you can play from the next round',
        },
      },
    }
  }

  if (validate && !validate(value)) {
    return {
      error: {
        status: 400,
        body: {
          success: false,
          message: 'Invalid submission',
        },
      },
    }
  }

  const bucket = PHASE_BUCKET[expectedPhase]

  room[bucket] = room[bucket] || {}
  room[bucket][playerName] = value

  player.lastSeen = Date.now()

  if (onAccepted) {
    onAccepted(room, player)
  }

  advanceIfPhaseComplete(room)

  io.to(room.code).emit('room-update', room)

  return {
    room,
  }
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
    (v) =>
      typeof v === 'string' &&
      v.length > 0,
  )

  if (result.error) {
    return res
      .status(result.error.status)
      .json(result.error.body)
  }

  res.json({
    success: true,
    room: result.room,
  })
})

app.post('/rooms/:roomCode/drawings', (req, res) => {
  const roomCode = req.params.roomCode.toUpperCase()
  const { playerName, dataUrl } = req.body

  const result = submitForPhase(
    roomCode,
    playerName,
    dataUrl || '',
    'draw',
    (v) =>
      typeof v === 'string' &&
      v.startsWith('data:image/'),
  )

  if (result.error) {
    return res
      .status(result.error.status)
      .json(result.error.body)
  }

  res.json({
    success: true,
    room: result.room,
  })
})

/**
 * Classic guess submission.
 *
 * This is intentionally unchanged in behaviour so Classic Mode continues
 * using guessingPage.tsx.
 */
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
      if (typeof of === 'string' && of.length > 0) {
        room.guessTargets = room.guessTargets || {}
        room.guessTargets[playerName] = of
      }
    },
  )

  if (result.error) {
    return res
      .status(result.error.status)
      .json(result.error.body)
  }

  res.json({
    success: true,
    room: result.room,
  })
})

/**
 * Leaderboard rating submission.
 *
 * Each player may only rate the drawing assigned to them by the server.
 */
app.post('/rooms/:roomCode/ratings', (req, res) => {
  const roomCode = req.params.roomCode.toUpperCase()
  const { playerName, rating } = req.body

  const numericRating = Number(rating)

  const room = rooms[roomCode]

  if (!room) {
    return res.status(404).json({
      success: false,
      message: 'Room not found',
    })
  }

  if (room.mode !== 'leaderboard') {
    return res.status(409).json({
      success: false,
      message: 'Ratings are only available in Leaderboard Mode.',
    })
  }

  const target = room.ratingTargets?.[playerName]

  if (!target) {
    return res.status(409).json({
      success: false,
      message: 'No drawing has been assigned to this player.',
    })
  }

  /*
   * submitForPhase validates the player, phase and mid-round status.
   * The target itself is stored by the server and is never accepted from
   * the client, preventing a client from rating a different drawing.
   */
  const result = submitForPhase(
    roomCode,
    playerName,
    numericRating,
    'rating',
    (v) =>
      Number.isInteger(v) &&
      v >= 0 &&
      v <= 100,
    (room, player) => {
    room.ratingTargets = room.ratingTargets || {}
    room.ratings = room.ratings || {}
    room.scores = {}

    room.ratings[player.name] = numericRating

    // Recalculate scores from all submitted ratings.
    for (const raterName of Object.keys(room.ratings)) {
      const targetName = room.ratingTargets[raterName]
      const playerRating = room.ratings[raterName]

      if (
        targetName &&
        typeof playerRating === 'number'
      ) {
        room.scores[targetName] =
          (room.scores[targetName] || 0) + playerRating
      }
    }
},
  )

  if (result.error) {
    return res
      .status(result.error.status)
      .json(result.error.body)
  }

  /*
   * The shared phase-completion helper moves us to ratingReveal once
   * everyone has submitted.
   */
  res.json({
    success: true,
    room: result.room,
  })
})

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id)

  socket.on('room-subscribe', (roomCode) => {
    if (!roomCode) {
      return
    }

    const code = roomCode.toUpperCase()

    socket.join(code)

    const room = rooms[code]

    if (room) {
      socket.emit('room-update', room)
    }
  })

  socket.on('hand-tracking-data', (data) => {
    if (data && data.roomCode) {
      socket
        .to(data.roomCode.toUpperCase())
        .emit('hand-tracking-update', data)
    } else {
      socket.broadcast.emit(
        'hand-tracking-update',
        data,
      )
    }
  })

  socket.on('drawing-event', (data) => {
    if (data && data.roomCode) {
      socket
        .to(data.roomCode.toUpperCase())
        .emit('drawing-update', data)
    } else {
      socket.broadcast.emit(
        'drawing-update',
        data,
      )
    }
  })

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id)
  })
})

server.listen(PORT, () => {
  console.log(
    `Gartic Hands server listening on http://localhost:${PORT}`,
  )
})