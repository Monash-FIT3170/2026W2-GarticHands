require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { generatePrompts, DIFFICULTIES } = require('./ai/promptGenerator');
const { MEDIUM_PROMPTS } = require('./data/promptBank');
const { drawPrompt, MAX_PROMPT_LENGTH } = require('./ai/drawer');
const { MAX_BOTS, nextBotName, botPrompt, botGuess, botRating } = require('./ai/bots');
const { generatePrompt, generateGuess } = require('./ai/guesser');

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

/**
 * roomCode -> counter bumped on every phase change. A bot turn remembers the
 * value it was scheduled under and does nothing if the room has moved on,
 * even when the room has come back round to the same phase name.
 */
const phaseSeq = {};
const PLAYER_TIMEOUT_MS = (() => {
  const parsed = Number(process.env.PLAYER_TIMEOUT_SECONDS)
  return Number.isFinite(parsed) && parsed > 0 ? parsed * 1000 : 30000
})()

const PRESENCE_SWEEP_MS = 3000
const EMPTY_ROOM_GRACE_MS = 60000

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Render (and most hosts) sit one proxy in front of the server. Trusting that
// hop makes `req.ip` the player's address rather than the proxy's, so the
// `/ai/draw` throttle is per player instead of global.
app.set('trust proxy', 1);

const rooms = {};

/** roomCode → epoch ms the room lost its last player. Kept off the room object. */
const emptySince = {};

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function makePlayer(name, isHost, joinedMidRound = false, isBot = false) {
  return {
    name,
    status: isHost ? 'host' : isBot ? 'ready' : 'waiting',
    isHost,
    // Bots are always ready, so they never hold up the host's Start button.
    ready: isHost || isBot,
    isBot,
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

  phaseSeq[room.code] = (phaseSeq[room.code] || 0) + 1;
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
  );

  // After the deadline is stamped: bots pace themselves against it. Bots only
  // act in timed phases, so the untimed early return above never needs this.
  scheduleBotTurns(room);
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
    // Try every offset once. Every player rejects the same two offsets (0 and
    // -promptOffset), so they all settle on the same one and each drawing
    // gets exactly one guesser.
    for (let step = 0; step < players.length; step += 1) {
      const targetIndex = (index + guessOffset + step) % players.length;
      const target = players[targetIndex];

      // Drawer `d` draws the prompt written by `d + promptOffset`, so this
      // player's own prompt was drawn by `index - promptOffset`. Guessing that
      // drawing would mean guessing your own prompt.
      const promptRecipient = players[(index - promptOffset + players.length) % players.length];

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
  // A bot can't press Start or pace the reveal, so it never holds the role.
  const humans = room.players.filter((p) => !p.isBot);

  if (humans.length === 0) {
    return;
  }

  const next = humans.reduce((a, b) => (a.joinedAt <= b.joinedAt ? a : b));

  next.isHost = true;
  next.status = 'host';
  next.ready = true;
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
      if (!drawing) {
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
  // Bots don't keep a room alive on their own — nobody is left to watch them.
  if (!room.players.some((p) => !p.isBot)) {
    room.players = [];
  }

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
    const room = rooms[code];

    // Bots never poll, so they are exempt from the presence check.
    const stale = room.players.filter((p) => !p.isBot && now - p.lastSeen > PLAYER_TIMEOUT_MS);

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
      clearPhaseTimer(code);
      delete rooms[code];
      delete emptySince[code];
      delete phaseSeq[code];
      delete promptStash[code];
      delete promptHistory[code];
    }
  }
}, PRESENCE_SWEEP_MS)

/**
 * Showdown scores for the round, rebuilt from every submitted rating.
 * Used as the rating submission's `onAccepted` hook, for players and bots.
 */
function recalculateScores(room) {
  room.ratingTargets = room.ratingTargets || {};
  room.ratings = room.ratings || {};
  room.scores = {};

  for (const raterName of Object.keys(room.ratings)) {
    const targetName = room.ratingTargets[raterName];
    const playerRating = room.ratings[raterName];

    if (targetName && typeof playerRating === 'number') {
      room.scores[targetName] = (room.scores[targetName] || 0) + playerRating;
    }
  }
}

/* ---------------------------------------------------------------------------
 * Bots
 *
 * Bots are ordinary players with `isBot: true`. The server plays their turns:
 * every phase change schedules one turn per active bot, which waits a
 * human-ish delay, works out its submission (see `ai/bots.js` and
 * `ai/drawer.js`), then submits through `submitForPhase` like anyone else.
 * ------------------------------------------------------------------------- */

/** How long a bot "thinks" in each phase, in ms, before submitting. */
const BOT_DELAYS_MS = {
  prompt: [2000, 5000],
  draw: [8000, 15000],
  guess: [4000, 9000],
  rating: [3000, 7000],
};

/** Multiplier on bot delays. `BOT_DELAY_SCALE=0` makes bots instant (tests). */
const BOT_DELAY_SCALE = (() => {
  const parsed = Number(process.env.BOT_DELAY_SCALE);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 1;
})();

/** Bots aim to submit at least this long before the deadline. */
const BOT_DEADLINE_MARGIN_MS = 3000;

function botDelay(room, phase) {
  const [min, max] = BOT_DELAYS_MS[phase];
  const wanted = (min + Math.random() * (max - min)) * BOT_DELAY_SCALE;

  if (!room.phaseEndsAt) {
    return wanted;
  }

  const latest = room.phaseEndsAt - Date.now() - BOT_DEADLINE_MARGIN_MS;
  return Math.max(0, Math.min(wanted, latest));
}

/** Work out what `botName` submits this phase, or null to sit it out. */
async function botSubmission(room, botName, phase) {
  // The prompt each drawer was handed: drawer -> author -> author's prompt.
  const promptDrawnBy = (drawer) => room.prompts[room.promptTargets?.[drawer]] || '';

  switch (phase) {
    case 'prompt':
      return botPrompt();

    case 'draw': {
      const prompt = promptDrawnBy(botName) || botPrompt();
      const drawing = await drawPrompt(prompt);
      return drawing.dataUrl;
    }

    case 'guess': {
      const target = room.guessTargets?.[botName];
      if (!target) return null;
      return botGuess({
        drawing: room.drawings[target] || '',
        truth: promptDrawnBy(target),
      });
    }

    case 'rating':
      return room.ratingTargets?.[botName] ? botRating() : null;

    default:
      return null;
  }
}

async function playBotTurn(roomCode, botName, phase) {
  const room = rooms[roomCode];
  if (!room) return;

  const seq = phaseSeq[roomCode];
  const waited = new Promise((resolve) => setTimeout(resolve, botDelay(room, phase)));

  let value;
  try {
    // Think (e.g. call the LLM) while the delay runs, not after it.
    const [submission] = await Promise.all([botSubmission(room, botName, phase), waited]);
    value = submission;
  } catch (err) {
    console.warn(`[bots] ${botName} failed its ${phase} turn: ${err.message}`);
    return;
  }

  // The room may have advanced, ended or emptied while the bot was thinking.
  const live = rooms[roomCode];
  if (!live || phaseSeq[roomCode] !== seq || live.phase !== phase) return;
  if (value === null || value === undefined) return;

  const bucket = PHASE_BUCKET[phase];
  if (live[bucket] && live[bucket][botName] !== undefined) return;

  const result = submitForPhase(
    roomCode,
    botName,
    value,
    phase,
    null,
    phase === 'rating' ? recalculateScores : undefined,
  );

  if (result.error && result.error.status !== 404) {
    console.warn(`[bots] ${botName} could not submit ${phase}: ${result.error.body.message}`);
  }
}

/** Called from `setPhase`: give every active bot its turn in the new phase. */
function scheduleBotTurns(room) {
  if (!BOT_DELAYS_MS[room.phase]) return;

  for (const bot of activePlayers(room)) {
    if (bot.isBot) {
      void playBotTurn(room.code, bot.name, room.phase);
    }
  }
}

app.get('/', (_req, res) => {
  res.json({ message: 'Gartic Hands server is running' })
})

/**
 * Add a bot to a lobby. Host only. Bots join ready, never host, and are
 * removed like anyone else via `DELETE /rooms/:code/players/:name`.
 */
app.post('/rooms/:roomCode/bots', (req, res) => {
  const roomCode = req.params.roomCode.toUpperCase();
  const { playerName } = req.body;
  const room = rooms[roomCode];

  if (!room) {
    return res.status(404).json({
      success: false,
      message: 'Room not found',
    });
  }

  const host = room.players.find((p) => p.name === playerName);

  if (!host || !host.isHost) {
    return res.status(403).json({
      success: false,
      message: 'Only the host can add bots.',
    });
  }

  if (room.status !== 'waiting' || room.phase !== 'lobby') {
    return res.status(409).json({
      success: false,
      message: 'Bots can only be added in the lobby.',
    });
  }

  const botCount = room.players.filter((p) => p.isBot).length;
  const name = nextBotName(room.players.map((p) => p.name));

  if (room.players.length >= MAX_PLAYERS || botCount >= MAX_BOTS || !name) {
    return res.status(409).json({
      success: false,
      message: 'No room for another bot.',
    });
  }

  room.players.push(makePlayer(name, false, false, true));
  host.lastSeen = Date.now();

  io.to(room.code).emit('room-update', room);
  res.json({
    success: true,
    room,
  });
});

/** ip -> epoch ms of the last `/ai/draw` call. */
const lastDrawRequest = {};
const DRAW_REQUEST_GAP_MS = 2000;

/**
 * Draw any prompt the way a bot would, outside a game. Powers the
 * Playground's "watch the AI draw it" box and makes the drawer easy to try.
 */
app.post('/ai/draw', async (req, res) => {
  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';

  if (!prompt || prompt.length > MAX_PROMPT_LENGTH) {
    return res.status(400).json({
      success: false,
      message: `Prompt must be 1-${MAX_PROMPT_LENGTH} characters.`,
    });
  }

  const now = Date.now();
  const last = lastDrawRequest[req.ip] || 0;

  if (now - last < DRAW_REQUEST_GAP_MS) {
    return res.status(429).json({
      success: false,
      message: 'Slow down — one drawing every couple of seconds.',
    });
  }

  lastDrawRequest[req.ip] = now;

  // Forget callers who have gone quiet so the map can't grow without bound.
  for (const ip of Object.keys(lastDrawRequest)) {
    if (now - lastDrawRequest[ip] > 60000) delete lastDrawRequest[ip];
  }

  const drawing = await drawPrompt(prompt);
  res.json({
    success: true,
    prompt: drawing.prompt,
    source: drawing.source,
    dataUrl: drawing.dataUrl,
  });
});

/**
 * Create a room.
 *
 * `mode` is optional so existing clients still create Classic rooms.
 *
 * `maxRounds` and `drawTimeSeconds` are configurable from the host lobby.
 */
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
  const { playerName, drawTimeSeconds, maxRounds, mode, aiMode } = req.body
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
  // The host picks the game mode and AI Mode from the lobby.
  const hasMode = Object.hasOwn(req.body, 'mode')
  const hasAiMode = Object.hasOwn(req.body, 'aiMode')

  if (
    (!hasDrawTime && !hasRounds && !hasMode && !hasAiMode) ||
    (hasDrawTime && !DRAW_TIME_OPTIONS.includes(drawTimeSeconds)) ||
    (hasRounds && !ROUND_OPTIONS.includes(maxRounds)) ||
    (hasMode && mode !== 'classic' && mode !== 'leaderboard') ||
    (hasAiMode && typeof aiMode !== 'boolean')
  ) {
    return res.status(400).json({ success: false, message: 'Invalid room settings.' })
  }

  if (hasDrawTime) room.drawTimeSeconds = drawTimeSeconds
  if (hasRounds) room.maxRounds = maxRounds
  if (hasMode) room.mode = mode
  if (hasAiMode) room.aiMode = aiMode
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
      message: 'Showdown Mode needs at least 2 players to start.',
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
    p.joinedMidRound = false;

    // Bots stay ready between games.
    if (!p.isHost && !p.isBot) {
      p.ready = false;
      p.status = 'waiting';
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
  if (room.mode !== 'leaderboard') return res.status(409).json({ success: false, message: 'Ratings are only available in Showdown Mode.' })

  const target = room.ratingTargets?.[playerName]
  if (!target) return res.status(409).json({ success: false, message: 'No drawing has been assigned to this player.' })

  const result = submitForPhase(roomCode, playerName, numericRating, 'rating',
    (v) => Number.isInteger(v) && v >= 0 && v <= 100,
    recalculateScores,
  );

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