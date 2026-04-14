import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import Card from './Card'

interface ChartData {
  date: string
  count: number
}

export default function SubmissionsChart() {
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('http://localhost:3000/api/submissions/stats')
      .then(res => res.json())
      .then(json => {
        // transform API shape into Recharts-friendly format
        const transformed = json.submissions_per_day.map((d: ChartData) => ({
          date: d.date.slice(5), // show MM-DD instead of full date
          count: d.count
        }))
        setData(transformed)
      })
      .catch(() => setError('Failed to load chart data'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Card className="border-indigo-500">
      <h2 className="text-xl font-semibold mb-4">Submissions Per Day</h2>
      {loading && <p className="text-gray-400 italic">Loading chart...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && data.length === 0 && (
        <p className="text-gray-400 italic">No data yet — submit something first.</p>
      )}
      {!loading && !error && data.length > 0 && (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}