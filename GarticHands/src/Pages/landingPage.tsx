import { useState } from "react"
import { useNavigate } from "react-router-dom"

export default function LandingPage() {
  const [name, setName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const navigate = useNavigate()

  async function joinRoom() {
    const response = await fetch ('http://localhost:3000/rooms/join', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        playerName: name,
        roomCode: roomCode
      }),

    })

    const data = await response.json()

    if (data.success) {
      navigate(`/join/${roomCode.toUpperCase()}`) 
    } else {
      alert(data.message)
    }
  }

  function hostRoom() {
    navigate('/host')
  }


  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className='text-4xl font-bold'>Gartic Hands</h1>

      <input
        placeholder='Your name'
        value={name}
        onChange={(e) => setName(e.target.value)}
        className='border px-4 py-2 rounded'
      />

      <input
        placeholder='Room code'
        value={roomCode}
        onChange={(e) => setRoomCode(e.target.value)}
        className='border px-4 py-2 rounded'
      />

      <button onClick={joinRoom} className='border px-4 py-2 rounded'>
        Join Room
      </button>

      <button onClick={hostRoom} className='border px-4 py-2 rounded'>
        Host Room
      </button>
    </div>
  )
}