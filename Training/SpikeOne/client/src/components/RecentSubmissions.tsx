import Card from './Card'
import { useSubmissionsStore } from '../store/submissionsStore'

export default function RecentSubmissions() {
  const submissions = useSubmissionsStore((state) => state.submissions)

  return (
    <Card className="border-orange-400">
      <h2 className="text-xl font-semibold mb-2">Recent Submissions</h2>
      {submissions.length === 0 ? (
        <p className="text-gray-400 italic">No submissions yet.</p>
      ) : (
        <ul className="space-y-2">
          {submissions.map((s) => (
            <li key={s.id} className="border rounded px-3 py-2 text-gray-700">
              {s.text}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}