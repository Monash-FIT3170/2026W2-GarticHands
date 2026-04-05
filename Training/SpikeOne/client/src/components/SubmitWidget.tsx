import { useState } from 'react'
import Card from './Card'

export default function SubmitWidget() {
  const [input, setInput] = useState('')
  const [status, setStatus] = useState('')

  const handleSubmit = async () => {
    if (!input.trim()) return
    setStatus('Submitting...')
    try {
      const res = await fetch('http://localhost:3000/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input })
      })
      const data = await res.json()
      if (data.success) {
        setStatus('Submitted!')
        setInput('')
      }
    } catch {
      setStatus('Failed to submit.')
    }
  }

  return (
    <Card className="border-purple-500">
      <h2 className="text-xl font-semibold mb-2">Submit Something</h2>
      <input
        type="text"
        placeholder="Type and submit..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
      />
      <button
        onClick={handleSubmit}
        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500"
      >
        Submit
      </button>
      {status && <p className="mt-2 text-sm text-gray-500">{status}</p>}
    </Card>
  )
}