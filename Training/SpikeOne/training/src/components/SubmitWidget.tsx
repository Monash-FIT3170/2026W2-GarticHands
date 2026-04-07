import { useState } from 'react'
import { useSubmissionsStore } from '../stores/submissionsStore'

export default function SubmitWidget() {
  const [value, setValue] = useState('')
  const status = useSubmissionsStore((s) => s.status)
  const submitToServer = useSubmissionsStore((s) => s.submitToServer)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const submission = value.trim()
    if (submission.length === 0) return
    await submitToServer(submission)
    setValue('')
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

