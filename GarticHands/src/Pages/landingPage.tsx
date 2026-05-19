import { useNavigate } from "react-router-dom"
import { useState } from "react"

export default function LandingPage() {
  const navigate = useNavigate()
  const [playerName, setPlayerName] = useState("")

  const canContinue = playerName.trim().length > 0

  function joinRoom() {
    if (!canContinue) return
    
      navigate('/join', {
        state: { playerName }
      })
  }

  function hostRoom() {
    if (!canContinue) return
    
      navigate('/host', {
        state: { playerName }
      }) 
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className='text-4xl font-bold'>Gartic Hands</h1>

      <input 
        type="text" 
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        placeholder="Enter Your Name"
        maxLength={20}
        className="border px-4 py-2 rounded"
      />

      <button 
        onClick={joinRoom} 
        disabled={!canContinue}
        className={`border px-4 py-2 rounded ${
          canContinue ? "" : "opacity-50 cursor-not-allowed"
        }`}
      >
        Join Room
      </button>

      <button 
      onClick={hostRoom} 
        disabled={!canContinue}
        className={`border px-4 py-2 rounded ${
          canContinue ? "" : "opacity-50 cursor-not-allowed"
        }`}
      >
        Host Room
      </button>
    </div>
  )
}