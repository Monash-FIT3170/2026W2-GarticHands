import { useState } from 'react'
import Card from './Card'
import { useSubmissionsStore } from '../store/submissionsStore'

export default function SubmitWidget() {
  const [input, setInput] = useState('')
  const [status, setStatus] = useState('')
  const addSubmission = useSubmissionsStore((state) => state.addSubmission)
  const setSubmissions = useSubmissionsStore((state) => state.setSubmissions)

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
        addSubmission(input)
        setStatus('Submitted!')
        setInput('')

        // immediately refresh from DB to stay in sync
        const updated = await fetch('http://localhost:3000/api/submissions')
        const updatedData = await updated.json()
        setSubmissions(updatedData.map((s: any) => ({
          id: s._id,
          text: s.content
        })))
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