import { useState } from 'react'
import JoinForm from '../components/JoinForm'

function JoinPage() {
  const [roomCode, setRoomCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [error, setError] = useState('')

  function handleJoin() {
    if (!roomCode.trim() || !playerName.trim()) {
      setError('Please enter both a room code and your name.')
      return
    }
    setError('')
    // TODO: connect to backend room validation once backend is ready
    console.log(`Joining room: ${roomCode} as ${playerName}`)
    alert(`Joining room ${roomCode} as ${playerName}`)
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