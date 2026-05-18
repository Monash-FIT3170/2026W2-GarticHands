const API_URL = 'http://localhost:3000'

export async function createRoom(hostName: string) {
  const res = await fetch(`${API_URL}/rooms/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hostName }),
  })

  return res.json()
}

export async function joinRoom(roomCode: string, playerName: string) {
  const res = await fetch(`${API_URL}/rooms/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomCode, playerName }),
  })

  return res.json()
}

export async function getRoom(roomCode: string) {
  const res = await fetch(`${API_URL}/rooms/${roomCode}`)
  return res.json()
}