import { useState } from 'react'

export default function SubmitWidget() {
  const [value, setValue] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>(
    'idle',
  )

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')

    try {
      const res = await fetch('http://localhost:4000/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission: value }),
      })

      if (!res.ok) throw new Error(`Request failed: ${res.status}`)

      setValue('')
      setStatus('success')
      window.setTimeout(() => setStatus('idle'), 1200)
    } catch (err) {
      console.error('Submit failed', err)
      setStatus('error')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold">SubmitWidget</h2>
      <form onSubmit={onSubmit} className="flex flex-col gap-2">
        <input
          className="border rounded p-2"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type a submission..."
        />
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
          type="submit"
          disabled={status === 'submitting' || value.trim().length === 0}
        >
          {status === 'submitting' ? 'Submitting…' : 'Submit'}
        </button>
      </form>

      {status === 'success' && (
        <p className="text-sm text-green-700">Submitted! (Check server console.)</p>
      )}
      {status === 'error' && (
        <p className="text-sm text-red-700">Something went wrong. Try again.</p>
      )}
    </div>
  )
}

