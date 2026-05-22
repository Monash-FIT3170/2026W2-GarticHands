import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Card from '../components/Card'

interface DayStat {
  date: string
  count: number
}

function StatsPage() {
  const [data, setData] = useState<DayStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:3001/api/stats')
      .then(res => res.json())
      .then(json => {
        // Transform the API response into what Recharts expects
        const chartData = json.submissions_per_day.map((item: DayStat) => ({
          date: new Date(item.date).toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'short'
          }),
          count: item.count
        }))
        setData(chartData)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch stats:', err)
        setLoading(false)
      })
  }, [])

  return (
    <Card>
    <div className="flex items-center mb-4">
      <h2 className="text-xl font-semibold">Submissions Per Day</h2>
      {loading ? (
        <p>Loading chart...</p>
      ) : data.length === 0 ? (
        <p className="text-gray-400 italic">No data to visualise yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
    </Card>
  )
}

export default StatsPage