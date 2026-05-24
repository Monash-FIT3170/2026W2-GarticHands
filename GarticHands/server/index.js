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

app.use(cors())
app.use(express.json())

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
  io.to(room.code).emit('game-start', room)
  res.json({ success: true, room })
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
