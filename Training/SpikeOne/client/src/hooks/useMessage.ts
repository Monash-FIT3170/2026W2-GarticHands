import { useState, useEffect } from 'react'

export default function useMessage() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('http://localhost:3000/api/message')
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(() => setError('Failed to fetch from server'))
      .finally(() => setLoading(false))
  }, [])

  return { message, loading, error }
}