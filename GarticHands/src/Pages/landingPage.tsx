import { useNavigate } from "react-router-dom"
import { useState } from "react"
import Logo from "./reuse_components/logo"
import TopRightButtons from "./reuse_components/top-right_buttons"

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

      <TopRightButtons />

      <Logo />

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