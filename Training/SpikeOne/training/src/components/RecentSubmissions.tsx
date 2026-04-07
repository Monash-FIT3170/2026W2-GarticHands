import { useSubmissionsStore } from '../stores/submissionsStore'

export default function RecentSubmissions() {
  const recent = useSubmissionsStore((s) => s.recent)
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xl font-semibold">RecentSubmissions</h2>
      {recent.length === 0 ? (
        <p className="text-gray-700">No data yet.</p>
      ) : (
        <ul className="list-disc pl-5 text-gray-800">
          {recent.map((s, i) => (
            <li key={`${i}-${s}`}>{s}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

