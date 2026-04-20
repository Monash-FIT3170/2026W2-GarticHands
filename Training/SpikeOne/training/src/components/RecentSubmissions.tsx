import { useEffect, useState } from 'react'
import { useSubmissionsStore } from '../stores/submissionsStore'

export default function RecentSubmissions() {
  const recent = useSubmissionsStore((s) => s.recent)
  const fetchSubmissions = useSubmissionsStore((s) => s.fetchSubmissions)
  const error = useSubmissionsStore((s) => s.error)
  const [polling, setPolling] = useState(true)

  useEffect(() => {
    void fetchSubmissions()
  }, [fetchSubmissions])

  useEffect(() => {
    if (!polling) return
    const id = window.setInterval(() => {
      void fetchSubmissions()
    }, 3000)
    return () => window.clearInterval(id)
  }, [fetchSubmissions, polling])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">RecentSubmissions</h2>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 rounded border bg-white hover:bg-gray-50 text-sm"
            onClick={() => void fetchSubmissions()}
            type="button"
          >
            Refresh
          </button>
          <label className="text-sm text-gray-700 flex items-center gap-2 select-none">
            <input
              type="checkbox"
              checked={polling}
              onChange={(e) => setPolling(e.target.checked)}
            />
            Auto-poll
          </label>
        </div>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      {recent.length === 0 ? (
        <p className="text-gray-700">No data yet.</p>
      ) : (
        <ul className="list-disc pl-5 text-gray-800">
          {recent.map((s) => (
            <li key={s._id}>{s.content}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

