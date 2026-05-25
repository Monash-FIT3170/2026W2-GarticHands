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

app.use(cors())
// PNG data URLs from the drawing canvas can be a few hundred KB; default is 100KB.
app.use(express.json({ limit: '10mb' }))

const rooms = {}

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

app.get('/', (_req, res) => {
  res.json({ message: 'Gartic Hands server is running' })
})

app.post('/rooms/create', (req, res) => {
  const { hostName } = req.body
  const roomCode = generateRoomCode()

  rooms[roomCode] = {
    code: roomCode,
    players: [
      {
        name: hostName || 'Host',
        status: 'host',
        isHost: true,
        ready: true,
        joinedAt: Date.now(),
      },
    ],
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

  room.players.push({
    name: playerName,
    status: 'waiting',
    isHost: false,
    ready: false,
    joinedAt: Date.now(),
  })

  io.to(room.code).emit('room-update', room)
  res.json({ success: true, room })
})

app.get('/rooms/:roomCode', (req, res) => {
  const roomCode = req.params.roomCode.toUpperCase()
  const room = rooms[roomCode]
  if (!room) {
    return res.status(404).json({ success: false, message: 'Room not found' })
  }
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

function submitForPhase(roomCode, playerName, value, expectedPhase, bucket, nextPhase, validate) {
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

  room[bucket] = room[bucket] || {}
  room[bucket][playerName] = value

  const everyoneSubmitted = room.players.every(
    (p) => room[bucket][p.name] !== undefined && room[bucket][p.name] !== null,
  )

  if (everyoneSubmitted) {
    room.phase = nextPhase
  }

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
    'prompts',
    'draw',
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
    'drawings',
    'guess',
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
    'guesses',
    'reveal',
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
