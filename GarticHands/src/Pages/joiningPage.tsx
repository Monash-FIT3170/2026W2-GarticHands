import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import JoinForm from '../components/JoinForm'
import { joinRoom } from '../api/room'

function JoinPage() {
  const navigate = useNavigate();

  const [roomCode, setRoomCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [error, setError] = useState('')

  async function handleJoin() {
    if (!roomCode.trim() || !playerName.trim()) {
      setError('Please enter both a room code and your name.')
      return
    }
    
    const data = await joinRoom(roomCode, playerName)

    if (!data.success) {
      setError(data.message || 'Room not found.')
      return
    }

    setError('')

    navigate(`/joined/${data.room.code}`, {
      state: {
        room: data.room,
        playerName,
      }
    })
  }

  return (
    <div style={{ padding: '40px', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Join a Game</h1>
      <p>Enter the room code shared by the host to join their game.</p>
      <JoinForm
        roomCode={roomCode}
        playerName={playerName}
        onRoomCodeChange={setRoomCode}
        onPlayerNameChange={setPlayerName}
        onJoin={handleJoin}
        error={error}
      />
    </div>
  )
}

export default JoinPage