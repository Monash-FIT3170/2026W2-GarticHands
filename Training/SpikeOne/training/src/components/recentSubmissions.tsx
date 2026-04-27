import { use, useEffect, useState } from 'react'
import useSubmissionStore from '../store/useSubmissionStore'

export default function RecentSubmissions() {
  const submissions = useSubmissionStore((state) => state.submissions)
  const setSubmissions = useSubmissionStore((state) => state.setSubmissions)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('http://localhost:5000/api/submissions')

      if (!response.ok) {
        throw new Error('Failed to fetch submission')
      }

      const data = await response.json()

      setSubmissions(data.submissions) 
    } catch {
      setError('Could not load submissions') 
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubmissions()
  }, [])
    
  return (
    <section>
      <h2 className='text-xl font-semibold mb-3'>Recent Submissions</h2>

      <button
        className='cursor-pointer bg-gray-200 text-black px-3 py-2 rounded mb-3'
        onClick={fetchSubmissions}
        >
          Refresh
      </button>

      {loading && <p>Loading...</p>}

      {error && <p>{error}</p>}

      {!loading && !error && submissions.length === 0 && (
        <p>No Data in backend.</p>
      )}

      {!loading && !error && submissions.length > 0 && (
        <ul className='list-disc pl-5'>
          {submissions.map((submission) => (
            <li key={submission._id}>{submission.content}</li>
          ))}
        </ul>
      )}
    </section>
  )
}