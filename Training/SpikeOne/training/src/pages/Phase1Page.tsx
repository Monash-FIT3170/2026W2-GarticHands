import { useEffect, useState } from 'react'
import Card from '../components/Card'
import LoadingScreen from '../components/LoadingScreen'

export default function Phase1Page() {
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [count, setCount] = useState(0)
  const [text, setText] = useState('Hello!')
  const [formValue, setFormValue] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        const res = await fetch('http://localhost:4000/api/message', {
          signal: controller.signal,
        })
        const data = (await res.json()) as { message?: string }
        setMessage(data.message ?? null)
      } catch (error) {
        console.error('Failed to fetch message', error)
      } finally {
        setLoading(false)
      }
    }

    void load()

    const timeoutId = window.setTimeout(() => {
      controller.abort()
      setLoading(false)
    }, 5000)

    return () => {
      controller.abort()
      window.clearTimeout(timeoutId)
    }
  }, [])

  if (loading) return <LoadingScreen label="Loading Phase 1…" />

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col gap-6">
      <Card>
        <div className="flex flex-col items-center gap-2">
          {message && (
            <p className="text-sm text-gray-600 mb-2">
              From server: <span className="font-mono">{message}</span>
            </p>
          )}
          <h2 className="text-xl font-semibold">Counter</h2>
          <p className="text-lg">{count}</p>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              onClick={() => setCount(count + 1)}
            >
              Increase
            </button>
            <button
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              onClick={() => setCount(count - 1)}
            >
              Decrease
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col items-center gap-2">
          {message && (
            <p className="text-sm text-gray-600 mb-2">
              From server: <span className="font-mono">{message}</span>
            </p>
          )}
          <h2 className="text-xl font-semibold">Text Display</h2>
          <p className="text-lg">{text}</p>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => setText('You clicked the button!')}
          >
            Change Text
          </button>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col items-center gap-2">
          {message && (
            <p className="text-sm text-gray-600 mb-2">
              From server: <span className="font-mono">{message}</span>
            </p>
          )}
          <h2 className="text-xl font-semibold">Form Input</h2>
          <form
            className="flex flex-col gap-2 items-center"
            onSubmit={(e) => {
              e.preventDefault()
              alert('Submitted: ' + formValue)
            }}
          >
            <input
              className="border rounded p-2 w-64"
              type="text"
              value={formValue}
              onChange={(e) => setFormValue(e.target.value)}
              placeholder="Type something..."
            />
            <button
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              type="submit"
            >
              Submit
            </button>
          </form>
        </div>
      </Card>
    </div>
  )
}

