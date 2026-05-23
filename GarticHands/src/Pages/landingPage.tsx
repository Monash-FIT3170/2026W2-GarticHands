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
    <div className="min-h-screen bg-[#6FADA0] flex flex-col items-center justify-center relative px-4 pb-24">

      {/* Top-right icons */}
      <div className="absolute top-5 right-6 flex gap-5 text-[#3D7A72]">
        {/* Volume */}
        <button className="hover:text-[#2A5E58] transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        </button>
        {/* Settings */}
        <button className="hover:text-[#2A5E58] transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
        {/* Rules */}
        <button className="hover:text-[#2A5E58] transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        </button>
      </div>

      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <img src="/logo.png" alt="GarticHand logo" className="w-52 drop-shadow-md" />
        <img src="/subtitle.png" alt="The Telephone Hand Game" className="h-8 -mt-3" />
      </div>

      {/* Card */}
      <div className="bg-[#559490] rounded-3xl px-10 py-8 flex flex-col items-center gap-5 w-full max-w-sm shadow-lg">

        {/* Avatar */}
        <div className="bg-white rounded-full w-24 h-24 flex items-center justify-center shadow-inner">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 text-[#D4623E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        </div>

        {/* Username input */}
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter username..."
          maxLength={20}
          className="w-full bg-white rounded-full px-6 py-3 text-center text-[#D4623E] placeholder-[#D4623E]/50 font-medium outline-none focus:ring-2 focus:ring-[#D4623E]/40"
        />

        {/* Buttons */}
        <div className="flex gap-3 w-full">
          <button
            onClick={joinRoom}
            disabled={!canContinue}
            className="flex-1 bg-white text-[#3D6B64] font-bold py-3 rounded-full border-2 border-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Join Room
          </button>
          <button
            onClick={hostRoom}
            disabled={!canContinue}
            className="flex-1 bg-[#2E5534] text-white font-bold py-3 rounded-full hover:bg-[#244529] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Host Game
          </button>
        </div>

      </div>
    </div>
  )
}