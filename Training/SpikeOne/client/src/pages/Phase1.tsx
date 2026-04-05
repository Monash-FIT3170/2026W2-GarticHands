import { useState } from 'react'
import Card from '../components/Card'
import LoadingSpinner from '../components/LoadingSpinner'
import useMessage from '../hooks/useMessage'

export default function Phase1() {
  const [count, setCount] = useState(0)
  const [text, setText] = useState('')
  const { message, loading, error } = useMessage()

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Phase 1: Widget Layout</h1>

      {error && (
        <p className="text-red-500 mb-4">{error}</p>
      )}

      {message && (
        <p className="text-gray-600 italic mb-6">Server says: "{message}"</p>
      )}

      <Card className="border-gray-800">
        <h2 className="text-xl font-semibold mb-2">Interactive Counter</h2>
        <p className="mb-3">Current Count: {count}</p>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
            onClick={() => setCount(count + 1)}
          >Increment</button>
          <button
            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
            onClick={() => setCount(count - 1)}
          >Decrement</button>
        </div>
      </Card>

      <Card className="border-blue-500 bg-blue-50">
        <h2 className="text-xl font-semibold mb-2">Static Information</h2>
        <p className="text-gray-500 italic">
          This widget displays static content. It is styled independently to
          demonstrate the layout structure of Phase 1.
        </p>
      </Card>

      <Card className="border-green-500">
        <h2 className="text-xl font-semibold mb-2">Live Input Preview</h2>
        <input
          type="text"
          placeholder="Type something..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <p>Preview: <span className="font-bold text-green-600">{text}</span></p>
      </Card>
    </div>
  )
}