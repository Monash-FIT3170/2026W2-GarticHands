require('dotenv').config()
const express = require('express')
const http = require('http')
const cors = require('cors')
const { Server } = require('socket.io')
const { generatePrompt, generateGuess } = require('./ai/guesser')
const { generatePrompts, DIFFICULTIES } = require('./ai/promptGenerator')
const { MEDIUM_PROMPTS } = require('./data/promptBank')

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
const DRAW_TIME_OPTIONS = [30, 45, 60, 90, 120, 150, 180, 240, 300, 360]
const ROUND_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8]

function phaseSeconds(envName, fallback) {
  const parsed = Number(process.env[envName])
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const PHASE_DURATIONS = {
  prompt: phaseSeconds('PROMPT_SECONDS', 60),
  draw: phaseSeconds('DRAW_SECONDS', 60),
  guess: phaseSeconds('GUESS_SECONDS', 60),
  rating: phaseSeconds('RATING_SECONDS', 60),
}

const PHASE_GRACE_MS = 1500

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

const FALLBACK_PROMPTS = MEDIUM_PROMPTS

const phaseTimers = {}
const promptStash = {}
let promptStashSeq = 0
const promptHistory = {}
const PROMPT_HISTORY_LIMIT = 100

const PLAYER_TIMEOUT_MS = (() => {
  const parsed = Number(process.env.PLAYER_TIMEOUT_SECONDS)
  return Number.isFinite(parsed) && parsed > 0 ? parsed * 1000 : 30000
})()

const PRESENCE_SWEEP_MS = 3000
const EMPTY_ROOM_GRACE_MS = 60000

app.use(cors())
app.use(express.json({ limit: '10mb' }))

const rooms = {}
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

function setPhase(room, phase) {
  clearPhaseTimer(room.code)
  room.phase = phase

  if (phase === 'prompt' && !room.aiMode) stashPromptsFor(room)
  if (phase === 'draw') recordPromptHistory(room)

  const duration =
    phase === 'draw' && !process.env.DRAW_SECONDS
      ? room.drawTimeSeconds || PHASE_DURATIONS.draw
      : PHASE_DURATIONS[phase]

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

function stashPromptsFor(room) {
  const id = ++promptStashSeq
  promptStash[room.code] = { id, prompts: [] }

  void generatePrompts({
    difficulty: 'medium',
    count: Math.max(1, activePlayers(room).length),
    exclude: promptHistory[room.code] || [],
  }).then(({ prompts }) => {
    const stash = promptStash[room.code]
    if (stash && stash.id === id) stash.prompts = prompts
  })
}

function recordPromptHistory(room) {
  const used = Object.values(room.prompts || {})
    .filter((p) => typeof p === 'string' && p.trim())
    .map((p) => p.toLowerCase().trim())
  const history = [...(promptHistory[room.code] || []), ...used]
  promptHistory[room.code] = history.slice(-PROMPT_HISTORY_LIMIT)
}

function fallbackPromptFor(room) {
  const taken = new Set(
    Object.values(room.prompts || {}).map((p) => String(p).toLowerCase().trim()),
  )
  const stash = promptStash[room.code]
  if (stash) {
    while (stash.prompts.length > 0) {
      const next = stash.prompts.shift()
      if (!taken.has(next)) return next
    }
  }
  return FALLBACK_PROMPTS[Math.floor(Math.random() * FALLBACK_PROMPTS.length)]
}

function defaultSubmission(phase, room) {
  if (phase === 'prompt') return fallbackPromptFor(room)
  if (phase === 'rating') return 0
  return ''
}

function createPromptTargets(room) {
  const players = activePlayers(room)
  room.promptTargets = {}
  if (players.length < 2) return
  const offset = ((room.round - 1) % (players.length - 1)) + 1
  players.forEach((player, index) => {
    const promptAuthorIndex = (index + offset) % players.length
    room.promptTargets[player.name] = players[promptAuthorIndex].name
  })
}

function createGuessTargets(room) {
  const players = activePlayers(room)
  room.guessTargets = {}
  if (players.length < 3) return
  const promptOffset = ((room.round - 1) % (players.length - 1)) + 1
  let guessOffset = (promptOffset + 1) % players.length
  if (guessOffset === 0) guessOffset = 1
  players.forEach((player, index) => {
    for (let step = 1; step < players.length; step += 1) {
      const targetIndex = (index + guessOffset + step - 1) % players.length
      const target = players[targetIndex]
      const promptRecipient = players[(index + promptOffset) % players.length]
      if (target.name !== player.name && target.name !== promptRecipient.name) {
        room.guessTargets[player.name] = target.name
        return
      }
    }
  })
}

function startDrawPhase(room) {
  createPromptTargets(room)
  if (room.mode === 'classic') {
    createGuessTargets(room)
  } else {
    room.guessTargets = {}
  }
  setPhase(room, 'draw')
}

function createRatingTargets(room) {
  const players = activePlayers(room)
  room.ratingTargets = {}
  if (players.length < 2) return
  const offset = ((room.round - 1) % (players.length - 1)) + 1
  players.forEach((player, index) => {
    const targetIndex = (index + offset) % players.length
    room.ratingTargets[player.name] = players[targetIndex].name
  })
}

function startRatingPhase(room) {
  createRatingTargets(room)
  setPhase(room, 'rating')
}

function expirePhase(roomCode, expectedPhase) {
  delete phaseTimers[roomCode]
  const room = rooms[roomCode]
  if (!room || room.phase !== expectedPhase) return

  const bucket = PHASE_BUCKET[expectedPhase]
  if (!bucket) return

  room[bucket] = room[bucket] || {}
  for (const player of activePlayers(room)) {
    const submission = room[bucket][player.name]
    if (submission === undefined || submission === null) {
      room[bucket][player.name] = defaultSubmission(expectedPhase, room)
    }
  }

  const completedPhase = expectedPhase

  if (expectedPhase === 'prompt') {
    startDrawPhase(room)
  } else if (room.mode === 'leaderboard' && expectedPhase === 'draw') {
    startRatingPhase(room)
  } else {
    setPhase(room, NEXT_PHASE[expectedPhase])
  }

  if (completedPhase === 'draw' && room.aiMode) {
    autoSubmitAIGuess(room).catch((err) =>
      console.error('[AI] Unhandled error in autoSubmitAIGuess:', err),
    )
  }

  io.to(room.code).emit('phase-timeout', { code: room.code, phase: expectedPhase })
  io.to(room.code).emit('room-update', room)
}

function promoteHost(room) {
  if (room.players.length === 0) return
  const next = room.players.reduce((a, b) => (a.joinedAt <= b.joinedAt ? a : b))
  next.isHost = true
  next.status = 'host'
  next.ready = true
}

function removePlayer(room, playerName) {
  const index = room.players.findIndex((p) => p.name === playerName)
  if (index === -1) return false

  const [gone] = room.players.splice(index, 1)
  delete room.prompts[playerName]
  delete room.drawings[playerName]
  delete room.guesses[playerName]
  delete room.ratings[playerName]

  if (room.promptTargets) {
    delete room.promptTargets[playerName]
    for (const recipient of Object.keys(room.promptTargets)) {
      if (room.promptTargets[recipient] === playerName) delete room.promptTargets[recipient]
    }
  }

  if (room.guessTargets) {
    delete room.guessTargets[playerName]
    for (const guesser of Object.keys(room.guessTargets)) {
      if (room.guessTargets[guesser] === playerName) delete room.guessTargets[guesser]
    }
  }

  if (room.ratingTargets) {
    delete room.ratingTargets[playerName]
    for (const rater of Object.keys(room.ratingTargets)) {
      if (room.ratingTargets[rater] === playerName) delete room.ratingTargets[rater]
    }
  }

  if (gone.isHost) promoteHost(room)
  return true
}

function advanceIfPhaseComplete(room) {
  const bucket = PHASE_BUCKET[room.phase]
  if (!bucket) return false

  const active = activePlayers(room)
  if (active.length === 0) return false

  const everyoneSubmitted = active.every(
    (p) => room[bucket][p.name] !== undefined && room[bucket][p.name] !== null,
  )
  if (!everyoneSubmitted) return false

  const completedPhase = room.phase

  if (room.phase === 'prompt') {
    startDrawPhase(room)
  } else if (room.mode === 'leaderboard' && room.phase === 'draw') {
    startRatingPhase(room)
  } else {
    setPhase(room, NEXT_PHASE[room.phase])
  }

  if (completedPhase === 'draw' && room.aiMode) {
    autoSubmitAIGuess(room).catch((err) =>
      console.error('[AI] Unhandled error in autoSubmitAIGuess:', err),
    )
  }

  return true
}

async function autoSubmitAIGuess(room) {
  if (room.phase !== 'guess') return

  const humanPlayers = activePlayers(room)
  if (humanPlayers.length === 0) return

  console.log(`[AI] Generating guesses for ${humanPlayers.length} drawing(s)...`)
  room.aiGuesses = room.aiGuesses || {}

  await Promise.all(
    humanPlayers.map(async (player) => {
      const drawing = room.drawings[player.name]
      if (!drawing || drawing.length < 1000) {
        room.aiGuesses[player.name] = 'a blank canvas'
        console.log(`[AI] ${player.name}'s drawing appears blank`)
        return
      }
      try {
        const guess = await generateGuess(drawing)
        console.log(`[AI] Guess for ${player.name}'s drawing: "${guess}"`)
        room.aiGuesses[player.name] = guess
      } catch (err) {
        console.error(`[AI] Guess failed for ${player.name}:`, err.message)
        room.aiGuesses[player.name] = 'something mysterious'
      }
    }),
  )

  setPhase(room, 'reveal')
  io.to(room.code).emit('room-update', room)
}

function afterPlayersLeft(room) {
  if (room.players.length === 0) {
    emptySince[room.code] = Date.now()
    return
  }
  delete emptySince[room.code]
  advanceIfPhaseComplete(room)
  io.to(room.code).emit('room-update', room)
}

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
      delete promptStash[code]
      delete promptHistory[code]
    }
  }
}, PRESENCE_SWEEP_MS)

app.get('/', (_req, res) => {
  res.json({ message: 'Gartic Hands server is running' })
})

app.post('/rooms/create', (req, res) => {
  const { hostName, mode, maxRounds, aiMode = false } = req.body
  const roomCode = generateRoomCode()
  const selectedMode = mode === 'leaderboard' ? 'leaderboard' : 'classic'
  const selectedMaxRounds = ROUND_OPTIONS.includes(maxRounds) ? maxRounds : MAX_ROUNDS

  rooms[roomCode] = {
    code: roomCode,
    players: [makePlayer(hostName || 'Host', true)],
    status: 'waiting',
    mode: selectedMode,
    phase: 'lobby',
    phaseEndsAt: null,
    round: 1,
    maxRounds: selectedMaxRounds,
    drawTimeSeconds: 60,
    aiMode,
    aiPrompt: null,
    aiGuess: null,
    aiGuesses: {},
    prompts: {},
    promptTargets: {},
    drawings: {},
    guesses: {},
    guessTargets: {},
    ratings: {},
    ratingTargets: {},
    scores: {},
    createdAt: Date.now(),
  }

  res.json({ success: true, roomCode, room: rooms[roomCode] })
})

app.patch('/rooms/:roomCode/settings', (req, res) => {
  const roomCode = req.params.roomCode.toUpperCase()
  const { playerName, drawTimeSeconds, maxRounds } = req.body
  const room = rooms[roomCode]

  if (!room) return res.status(404).json({ success: false, message: 'Room not found' })

  const player = room.players.find((p) => p.name === playerName)
  if (!player) return res.status(404).json({ success: false, message: 'Player not found' })
  if (!player.isHost) return res.status(403).json({ success: false, message: 'Only the host can update room settings.' })
  if (room.status !== 'waiting' || room.phase !== 'lobby') {
    return res.status(409).json({ success: false, message: 'Room settings cannot be changed after the game starts.' })
  }

  const hasDrawTime = Object.hasOwn(req.body, 'drawTimeSeconds')
  const hasRounds = Object.hasOwn(req.body, 'maxRounds')

  if (
    (!hasDrawTime && !hasRounds) ||
    (hasDrawTime && !DRAW_TIME_OPTIONS.includes(drawTimeSeconds)) ||
    (hasRounds && !ROUND_OPTIONS.includes(maxRounds))
  ) {
    return res.status(400).json({ success: false, message: 'Invalid room settings.' })
  }

  if (hasDrawTime) room.drawTimeSeconds = drawTimeSeconds
  if (hasRounds) room.maxRounds = maxRounds
  player.lastSeen = Date.now()

  io.to(room.code).emit('room-update', room)
  res.json({ success: true, room })
})

app.post('/rooms/join', (req, res) => {
  const { roomCode, playerName } = req.body

  if (!roomCode || !playerName) {
    return res.status(400).json({ success: false, message: 'Room code and player name are required' })
  }

  const room = rooms[roomCode.toUpperCase()]
  if (!room) return res.status(404).json({ success: false, message: 'Room not found' })
  if (room.players.length >= MAX_PLAYERS) {
    return res.status(409).json({ success: false, message: `Room is full (${MAX_PLAYERS} players maximum).` })
  }
  if (room.players.some((player) => player.name.toUpperCase() === playerName.toUpperCase())) {
    return res.status(409).json({ success: false, message: `Player Name "${playerName}" Invalid: Already Exists in Lobby.` })
  }

  room.players.push(makePlayer(playerName, false, room.status === 'started'))
  delete emptySince[room.code]

  if (!room.players.some((p) => p.isHost)) promoteHost(room)

  io.to(room.code).emit('room-update', room)
  res.json({ success: true, room })
})

app.get('/rooms/:roomCode', (req, res) => {
  const roomCode = req.params.roomCode.toUpperCase()
  const room = rooms[roomCode]
  if (!room) return res.status(404).json({ success: false, message: 'Room not found' })

  const { playerName } = req.query
  if (playerName) {
    const player = room.players.find((p) => p.name === playerName)
    if (player) player.lastSeen = Date.now()
  }

  res.json({ success: true, room, serverTime: Date.now() })
})

app.delete('/rooms/:roomCode/players/:playerName', (req, res) => {
  const roomCode = req.params.roomCode.toUpperCase()
  const room = rooms[roomCode]
  if (!room) return res.status(404).json({ success: false, message: 'Room not found' })

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

  if (!room) return res.status(404).json({ success: false, message: 'Room not found' })

  const player = room.players.find((p) => p.name === playerName)
  if (!player) return res.status(404).json({ success: false, message: 'Player not found' })

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
  if (!room) return res.status(404).json({ success: false, message: 'Room not found' })

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
  room.promptTargets = {}
  room.drawings = {}
  room.guesses = {}
  room.guessTargets = {}
  room.ratings = {}
  room.ratingTargets = {}
  room.scores = {}
  room.aiPrompt = null
  room.aiGuess = null
  room.aiGuesses = {}

  for (const p of room.players) {
    p.joinedMidRound = false
  }

  setPhase(room, 'prompt')
  io.to(room.code).emit('game-start', room)
  io.to(room.code).emit('room-update', room)

  if (room.aiMode) {
    const players = activePlayers(room)
    Promise.all(
      players.map((player) =>
        generatePrompt()
          .then((prompt) => {
            room.prompts[player.name] = prompt
            console.log(`[AI] Generated prompt for ${player.name}: "${prompt}"`)
          })
          .catch(() => {
            const fallback = FALLBACK_PROMPTS[Math.floor(Math.random() * FALLBACK_PROMPTS.length)]
            room.prompts[player.name] = fallback
            console.log(`[AI] Fallback prompt for ${player.name}: "${fallback}"`)
          }),
      ),
    )
      .then(() => {
        const firstPlayer = players[0]
        if (firstPlayer) room.aiPrompt = room.prompts[firstPlayer.name]
        advanceIfPhaseComplete(room)
        io.to(room.code).emit('room-update', room)
      })
      .catch((err) => {
        console.error('[AI] Prompt generation failed:', err.message)
      })
  }

  res.json({ success: true, room })
})

app.patch('/rooms/:roomCode/restart', (req, res) => {
  const roomCode = req.params.roomCode.toUpperCase()
  const room = rooms[roomCode]
  if (!room) return res.status(404).json({ success: false, message: 'Room not found' })

  if ((room.round || 1) >= room.maxRounds) {
    return res.status(409).json({
      success: false,
      message: `Cannot start round ${(room.round || 1) + 1} — max rounds is ${room.maxRounds}. Use /end to return to the lobby.`,
      maxRounds: room.maxRounds,
    })
  }

  room.status = 'started'
  room.prompts = {}
  room.promptTargets = {}
  room.drawings = {}
  room.guesses = {}
  room.guessTargets = {}
  room.ratings = {}
  room.ratingTargets = {}
  room.round = (room.round || 1) + 1
  room.aiPrompt = null
  room.aiGuess = null
  room.aiGuesses = {}

  for (const p of room.players) {
    p.joinedMidRound = false
  }

  setPhase(room, 'prompt')
  io.to(room.code).emit('room-update', room)

  if (room.aiMode) {
    const players = activePlayers(room)
    Promise.all(
      players.map((player) =>
        generatePrompt()
          .then((prompt) => {
            room.prompts[player.name] = prompt
            console.log(`[AI] Generated prompt for ${player.name} round ${room.round}: "${prompt}"`)
          })
          .catch(() => {
            const fallback = FALLBACK_PROMPTS[Math.floor(Math.random() * FALLBACK_PROMPTS.length)]
            room.prompts[player.name] = fallback
          }),
      ),
    )
      .then(() => {
        const firstPlayer = players[0]
        if (firstPlayer) room.aiPrompt = room.prompts[firstPlayer.name]
        advanceIfPhaseComplete(room)
        io.to(room.code).emit('room-update', room)
      })
      .catch((err) => {
        console.error('[AI] Prompt generation failed:', err.message)
      })
  }

  res.json({ success: true, room, maxRounds: room.maxRounds })
})

app.patch('/rooms/:roomCode/end', (req, res) => {
  const roomCode = req.params.roomCode.toUpperCase()
  const room = rooms[roomCode]
  if (!room) return res.status(404).json({ success: false, message: 'Room not found' })

  room.status = 'waiting'
  room.round = 1
  room.prompts = {}
  room.promptTargets = {}
  room.drawings = {}
  room.guesses = {}
  room.guessTargets = {}
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
  res.json({ success: true, room })
})

app.patch('/rooms/:roomCode/rating-reveal', (req, res) => {
  const roomCode = req.params.roomCode.toUpperCase()
  const room = rooms[roomCode]
  if (!room) return res.status(404).json({ success: false, message: 'Room not found' })

  if (room.mode !== 'leaderboard' || room.phase !== 'ratingReveal') {
    return res.status(409).json({ success: false, message: `Cannot show leaderboard during '${room.phase}' phase` })
  }

  setPhase(room, 'leaderboard')
  io.to(room.code).emit('room-update', room)
  res.json({ success: true, room })
})

function submitForPhase(roomCode, playerName, value, expectedPhase, validate, onAccepted) {
  const room = rooms[roomCode]
  if (!room) return { error: { status: 404, body: { success: false, message: 'Room not found' } } }

  const player = room.players.find((p) => p.name === playerName)
  if (!player) return { error: { status: 404, body: { success: false, message: 'Player not found' } } }

  if (room.phase !== expectedPhase) {
    return { error: { status: 409, body: { success: false, message: `Cannot submit during '${room.phase}' phase` } } }
  }

  if (player.joinedMidRound) {
    return { error: { status: 409, body: { success: false, message: 'You joined mid-round — you can play from the next round' } } }
  }

  if (validate && !validate(value)) {
    return { error: { status: 400, body: { success: false, message: 'Invalid submission' } } }
  }

  const bucket = PHASE_BUCKET[expectedPhase]
  room[bucket] = room[bucket] || {}
  room[bucket][playerName] = value
  player.lastSeen = Date.now()

  if (onAccepted) onAccepted(room, player)

  advanceIfPhaseComplete(room)
  io.to(room.code).emit('room-update', room)
  return { room }
}

app.post('/rooms/:roomCode/prompts', (req, res) => {
  const roomCode = req.params.roomCode.toUpperCase()
  const { playerName, prompt } = req.body
  const trimmed = (prompt || '').trim()

  const result = submitForPhase(roomCode, playerName, trimmed, 'prompt', (v) => typeof v === 'string' && v.length > 0)
  if (result.error) return res.status(result.error.status).json(result.error.body)
  res.json({ success: true, room: result.room })
})

app.post('/rooms/:roomCode/drawings', (req, res) => {
  const roomCode = req.params.roomCode.toUpperCase()
  const { playerName, dataUrl } = req.body

  const result = submitForPhase(roomCode, playerName, dataUrl || '', 'draw', (v) => typeof v === 'string' && v.startsWith('data:image/'))
  if (result.error) return res.status(result.error.status).json(result.error.body)
  res.json({ success: true, room: result.room })
})

app.post('/rooms/:roomCode/guesses', (req, res) => {
  const roomCode = req.params.roomCode.toUpperCase()
  const { playerName, guess } = req.body
  const trimmed = (guess || '').trim()
  const room = rooms[roomCode]

  if (!room) return res.status(404).json({ success: false, message: 'Room not found' })

  const target = room.guessTargets?.[playerName]
  if (!target) return res.status(409).json({ success: false, message: 'No drawing has been assigned to this player.' })

  const result = submitForPhase(roomCode, playerName, trimmed, 'guess', (v) => typeof v === 'string',
    (room, player) => {
      room.guessTargets = room.guessTargets || {}
      room.guessTargets[player.name] = target
    },
  )

  if (result.error) return res.status(result.error.status).json(result.error.body)
  res.json({ success: true, room: result.room })
})

const AI_RATE_LIMIT = { windowMs: 60000, max: 20 }
const aiRequestLog = {}

function withinAiBudget(ip) {
  const now = Date.now()
  const entry = aiRequestLog[ip]
  if (!entry || now - entry.windowStart > AI_RATE_LIMIT.windowMs) {
    aiRequestLog[ip] = { windowStart: now, count: 1 }
    return true
  }
  entry.count += 1
  return entry.count <= AI_RATE_LIMIT.max
}

setInterval(() => {
  const now = Date.now()
  for (const ip of Object.keys(aiRequestLog)) {
    if (now - aiRequestLog[ip].windowStart > AI_RATE_LIMIT.windowMs) delete aiRequestLog[ip]
  }
}, AI_RATE_LIMIT.windowMs).unref()

app.post('/ai/prompts', async (req, res) => {
  const body = req.body || {}
  const { theme, count, exclude } = body
  const difficulty = DIFFICULTIES.includes(body.difficulty) ? body.difficulty : 'easy'
  const excludeList = Array.isArray(exclude) ? exclude.slice(-200) : []

  const options = { theme, difficulty, count, exclude: excludeList }
  const result = withinAiBudget(req.ip)
    ? await generatePrompts(options)
    : await generatePrompts({ ...options, forceFallback: true })

  res.json({ success: true, ...result })
})

app.post('/rooms/:roomCode/ratings', (req, res) => {
  const roomCode = req.params.roomCode.toUpperCase()
  const { playerName, rating } = req.body
  const numericRating = Number(rating)
  const room = rooms[roomCode]

  if (!room) return res.status(404).json({ success: false, message: 'Room not found' })
  if (room.mode !== 'leaderboard') return res.status(409).json({ success: false, message: 'Ratings are only available in Leaderboard Mode.' })

  const target = room.ratingTargets?.[playerName]
  if (!target) return res.status(409).json({ success: false, message: 'No drawing has been assigned to this player.' })

  const result = submitForPhase(roomCode, playerName, numericRating, 'rating',
    (v) => Number.isInteger(v) && v >= 0 && v <= 100,
    (room, player) => {
      room.ratingTargets = room.ratingTargets || {}
      room.ratings = room.ratings || {}
      room.scores = {}
      room.ratings[player.name] = numericRating
      for (const raterName of Object.keys(room.ratings)) {
        const targetName = room.ratingTargets[raterName]
        const playerRating = room.ratings[raterName]
        if (targetName && typeof playerRating === 'number') {
          room.scores[targetName] = (room.scores[targetName] || 0) + playerRating
        }
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