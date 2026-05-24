import { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { createRoom, getRoom, startRoom } from "../api/room"
import Logo from "./reuse_components/logo"
import TopRightButtons from "./reuse_components/top-right_buttons"

const Badge = ({ player }: { player: any }) => {
  if (player.isHost) {
    return (
      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-yellow-200 text-[#D4623E] border-2 border-[#D4623E] text-sm font-bold">
        ★
      </span>
    )
  }

  if (player.ready) {
    return (
      <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-200 text-[#2E5534]">
        Ready
      </span>
    )
  }

  return (
    <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#8EBAB3] text-[#3D6B64]">
      Waiting
    </span>
  )
}

export default function HostingPage() {
  const [roomCode, setRoomCode] = useState("")
  const [players, setPlayers] = useState<any[]>([])
  const [toast, setToast] = useState("")
  const [toastVisible, setToastVisible] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()

  const hostName = location.state?.playerName

  useEffect(() => {
    async function setupRoom() {
      if (!hostName) {
        navigate("/")
        return
      }

      const data = await createRoom(hostName)

      if (data.success) {
        setRoomCode(data.roomCode)
        setPlayers(data.room.players)
      }
    }

    setupRoom()
  }, [])

  useEffect(() => {
    if (!roomCode) return

    async function loadRoom() {
      const data = await getRoom(roomCode)

      if (data.success) {
        setPlayers(data.room.players)
      }
    }

    const interval = setInterval(loadRoom, 1000)

    return () => clearInterval(interval)
  }, [roomCode])

  const showToast = (msg: string) => {
    setToast(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2000)
  }

  const copyCode = () => {
    if (!roomCode) return
    navigator.clipboard.writeText(roomCode).catch(() => {})
    showToast("Invite code copied!")
  }

  const handleStart = async () => {
    if (!allReady) return

    await startRoom(roomCode)
    showToast("Starting game...")
    setTimeout(() => navigate("/input"), 1200)
  }

  const readyCount = players.filter((p) => p.ready || p.isHost).length
  const allReady = players.length > 0 && players.every((p) => p.ready || p.isHost)

  return (
    <div className="min-h-screen bg-[#6FADA0] flex flex-col items-center justify-center relative px-4 py-10">
      <TopRightButtons />

      <div className="scale-90 -mb-4">
        <Logo />
      </div>

      <div className="relative bg-[#5E9990] rounded-xl shadow-lg w-full max-w-4xl px-8 py-8 border-4 border-[#6FADA0]">
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-[#2F4542] flex items-center justify-center shadow-xl">
          <div className="w-16 h-16 rounded-full bg-[#E67B2E] flex items-center justify-center text-white text-4xl font-bold">
            {hostName ? hostName.charAt(0).toUpperCase() : "H"}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-8 mt-8">
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white text-2xl font-extrabold tracking-wide">
                PLAYERS {players.length}
              </h2>

              <p className="text-white/80 text-sm font-semibold">
                {readyCount}/{players.length} ready
              </p>
            </div>

            <div className="space-y-4 max-h-72 overflow-y-auto pr-3">
              {players.map((player, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-4 rounded-full px-4 py-3 border-2 shadow-sm ${
                    player.isHost
                      ? "bg-white border-[#78EF57]"
                      : "bg-[#79A8A0] border-[#3D6B64]"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      player.isHost
                        ? "border-[#D4623E] text-[#D4623E] bg-white"
                        : "border-[#3D6B64] text-[#3D6B64] bg-[#8EBAB3]"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-bold truncate ${
                        player.isHost ? "text-[#D4623E]" : "text-[#3D6B64]"
                      }`}
                    >
                      {player.name}
                      {player.isHost ? " (You)" : ""}
                    </p>
                  </div>

                  <Badge player={player} />
                </div>
              ))}

              {Array.from({ length: Math.max(0, 4 - players.length) }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="flex items-center gap-4 rounded-full px-4 py-3 bg-[#79A8A0] border-2 border-[#3D6B64] opacity-80"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#3D6B64] text-[#3D6B64] bg-[#8EBAB3]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                  </div>

                  <p className="flex-1 text-center text-[#C8DDD9] font-bold">
                    Empty
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col items-center">
            <h2 className="text-white text-2xl font-extrabold tracking-wide mb-5">
              GAMEMODE
            </h2>

            <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
              <button className="bg-white rounded-lg border-4 border-[#78EF57] px-4 py-4 flex flex-col items-center justify-center shadow-sm">
                <div className="text-3xl mb-1">🎨</div>
                <p className="text-[#2E5534] font-extrabold">Classic</p>
              </button>

              <button className="bg-white rounded-lg border-4 border-transparent px-4 py-4 flex flex-col items-center justify-center shadow-sm opacity-90">
                <div className="text-3xl mb-1">🤖</div>
                <p className="text-[#2E5534] font-extrabold">AI Guessing</p>
              </button>
            </div>

            <button
              onClick={copyCode}
              className="mt-6 w-full max-w-xs bg-white text-[#D4623E] border-2 border-[#D4623E] rounded-lg py-3 font-extrabold hover:bg-orange-50 transition-colors"
            >
              Copy Invite Code
            </button>

            <button
              onClick={handleStart}
              disabled={!allReady}
              className={`mt-4 w-full max-w-xs rounded-lg py-3 font-extrabold transition-colors ${
                allReady
                  ? "bg-[#78EF57] text-[#2E5534] hover:bg-[#67DD48]"
                  : "bg-[#9CC9C1] text-[#47756E] cursor-not-allowed"
              }`}
            >
              {allReady ? "Start Game" : "Waiting for Players"}
            </button>

            <p className="mt-4 text-white/80 text-sm text-center font-semibold">
              Room Code:{" "}
              <button onClick={copyCode} className="font-mono underline">
                {roomCode || "Creating..."}
              </button>
            </p>
          </section>
        </div>
      </div>

      {toastVisible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#2F4542] text-white px-5 py-3 rounded-full shadow-lg font-semibold">
          {toast}
        </div>
      )}
    </div>
  )
}