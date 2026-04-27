import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

interface StatItem {
  date: string
  count: number
}

export default function StatsChart() {
  const [data, setData] = useState<StatItem[]>([])

  useEffect(() => {
    fetch('http://localhost:5000/api/submissions/stats')
      .then((response) => response.json())
      .then((result) => {
        setData(result.submissions_per_day)
      })
      .catch((error) => {
        console.error('Failed to fetch stats:', error)
      })
  }, [])

  return (
    <section className='w-[500px] p-5 border-2 rounded-xl shadow-lg bg-white'>
      <h2 className='text-xl font-semibold mb-4'>Submissions Per Day</h2>

      <LineChart width={450} height={300} data={data}>
        <CartesianGrid strokeDasharray='3 3' />
        <XAxis dataKey='date' />
        <YAxis />
        <Tooltip />
        <Line type='monotone' dataKey='count' />
      </LineChart>
    </section>
  )
}