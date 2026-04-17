import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Card from '../components/Card'
import LoadingScreen from '../components/LoadingScreen'

type StatsResponse = {
  submissions_per_day: Array<{ date: string; count: number }>
}

export default function Phase13Page() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<StatsResponse['submissions_per_day']>([])

  async function fetchStats() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('http://localhost:4000/api/stats')
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const json = (await res.json()) as StatsResponse
      setData(json.submissions_per_day ?? [])
    } catch (e) {
      console.error('Failed to fetch stats', e)
      setError('Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchStats()
  }, [])

  const chartData = useMemo(() => {
    return data.map((d) => ({
      day: d.date,
      submissions: d.count,
    }))
  }, [data])

  if (loading) return <LoadingScreen label="Loading Phase 13…" />

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col gap-6">
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Phase 13 — Data Visualisation</h1>
            <p className="text-sm text-gray-600 mt-1">
              Submissions grouped per day (from <span className="font-mono">/api/stats</span>)
            </p>
          </div>
          <button
            className="px-4 py-2 rounded border bg-white hover:bg-gray-50"
            type="button"
            onClick={() => void fetchStats()}
          >
            Refresh
          </button>
        </div>

        {error && <p className="text-sm text-red-700 mt-3">{error}</p>}
      </Card>

      <Card>
        {chartData.length === 0 ? (
          <p className="text-gray-700">No submissions yet.</p>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="submissions" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  )
}

