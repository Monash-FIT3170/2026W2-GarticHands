import { useNavigate } from "react-router-dom"

export default function LandingPage() {
  const navigate = useNavigate()

  async function joinRoom() {
    navigate('/join')
  }

  function hostRoom() {
    navigate('/host')
  }

  function guessRoom() {
    navigate('/guess')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className='text-4xl font-bold'>Gartic Hands</h1>

      <button onClick={joinRoom} className='border px-4 py-2 rounded'>
        Join Room
      </button>

      <button onClick={hostRoom} className='border px-4 py-2 rounded'>
        Host Room
      </button>
    </div>
  )
}