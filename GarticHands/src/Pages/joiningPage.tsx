import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import JoinForm from '../components/JoinForm'
import { joinRoom } from '../api/room'

function JoinPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const playerName = location.state?.playerName

  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')

  async function handleJoin() {
    if (!playerName) {
      navigate('/')
      return
    }
    
    if (!roomCode.trim()) {
      setError('Please enter room code.')
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
        onRoomCodeChange={setRoomCode}
        onJoin={handleJoin}
        error={error}
      />
    </div>
  )
}

export default JoinPage