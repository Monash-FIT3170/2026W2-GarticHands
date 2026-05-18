const express = require('express')
const cors = require('cors')

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

const rooms = {}

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

app.get('/', (req, res) => {
  res.send('GarticHands backend is running')
})

app.post('/rooms/create', (req, res) => {
  const roomCode = generateRoomCode()

  rooms[roomCode] = {
    code: roomCode,
    players: [],
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

  room.players.push({
    name: playerName,
    joinedAt: Date.now(),
  })

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

  res.json({
    success: true,
    room,
  })
})

app.patch('/rooms/:roomCode/ready', (req, res) => {
  const roomCode = req.params.roomCode.toUpperCase()
  const { playerName, ready } = req.body

  const room = rooms[roomCode]

  if (!room) {
    return res.status(404).json({
      success: false,
      message: 'Room not found',
    })
  }

  const player = room.players.find((p) => p.name === playerName)

  if (!player) {
    return res.status(404).json({
      success: false,
      message: 'Player not found',
    })
  }

  if (player.status !== 'host') {
    player.status = ready ? 'ready' : 'waiting'
  }

  res.json({
    success: true,
    room,
  })
})

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})