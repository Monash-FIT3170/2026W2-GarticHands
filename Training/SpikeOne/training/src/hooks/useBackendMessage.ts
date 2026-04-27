import { useEffect, useState } from 'react'

export default function useBackendMessage() {
  const [message, setMessage] = useState('Loading backend message...')
  const [error, setError] = useState('')
  const [messageLoading, setMessageLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:5000/api/message')
    .then((response) => {
        if (!response.ok) {
            throw new Error('Failed to fetch message')
        }
        return response.json()
    })
    .then((data) => {
        setMessage(data.message)
        setMessageLoading(false)
    })
    .catch(() => {
        setError('Could not connect to backend')
        setMessageLoading(false)
    })
  }, [])

  return {
    message,
    error,
    messageLoading
  }
}