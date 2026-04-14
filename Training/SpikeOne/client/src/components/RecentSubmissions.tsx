import { useEffect } from 'react'
import Card from './Card'
import { useSubmissionsStore } from '../store/submissionsStore'

export default function RecentSubmissions() {
  const submissions = useSubmissionsStore((state) => state.submissions)
  const setSubmissions = useSubmissionsStore((state) => state.setSubmissions)

  const fetchSubmissions = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/submissions')
      const data = await res.json()
      setSubmissions(data.map((s: any) => ({
        id: s._id,
        text: s.content
      })))
    } catch (err) {
      console.error('Failed to fetch submissions:', err)
    }
  }

  useEffect(() => {
    // fetch immediately on mount
    fetchSubmissions()

    // then poll every 5 seconds
    const interval = setInterval(fetchSubmissions, 5000)

    // cleanup on unmount
    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="border-orange-400">
      <h2 className="text-xl font-semibold mb-2">Recent Submissions</h2>
      {submissions.length === 0 ? (
        <p className="text-gray-400 italic">No submissions yet.</p>
      ) : (
        <ul className="space-y-2">
          {submissions.map((s) => (
            <li key={s.id} className="border rounded px-3 py-2 text-gray-700 flex justify-between">
              <span>{s.text}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}