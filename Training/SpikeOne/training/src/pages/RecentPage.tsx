import { useEffect } from 'react'
import Card from '../components/Card'
import useSubmissionStore from '../store/useSubmissionStore'

function RecentPage() {
  const submissions = useSubmissionStore((state) => state.submissions)
  const setSubmissions = useSubmissionStore((state) => state.setSubmissions)

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/submissions')
        const data = await res.json()
        setSubmissions(data)
      } catch (err) {
        console.error('Failed to fetch submissions:', err)
      }
    }

    // Fetch immediately when the component loads
    fetchSubmissions()

    // Auto-poll every 5 seconds so new submissions appear automatically
    const interval = setInterval(fetchSubmissions, 5000)

    // Cleanup: stop polling when the user navigates away
    return () => clearInterval(interval)
  }, [setSubmissions])


  return (
    <Card>
      <div className="text-2xl font-bold mb-4">Recent Submissions</div>
      {submissions.length === 0 ? (
        <p className="text-gray-400 italic">No submissions yet</p>
      ) : (
        <ul className="space-y-2">
          {submissions.map((sub) => (
            <li key={sub._id || sub.id} className="p-3 bg-gray-50 rounded border">
              <p>{sub.content}</p>
              <p className="text-xs text-gray-400">
                {new Date(sub.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default RecentPage;
