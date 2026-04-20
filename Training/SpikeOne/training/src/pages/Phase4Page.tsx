import { useEffect, useState } from 'react'
import LoadingScreen from '../components/LoadingScreen'

export default function Phase4Page() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 900)
    return () => window.clearTimeout(t)
  }, [])

  if (loading) return <LoadingScreen label="Loading Phase 4…" />

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Phase 4</h1>
      <p className="text-gray-700 mt-2">
        This phase page is hooked up and demonstrates the loading state.
      </p>
    </div>
  )
}

