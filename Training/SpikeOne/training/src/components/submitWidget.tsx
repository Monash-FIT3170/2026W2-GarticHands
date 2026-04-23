import { useState } from 'react'
import useSubmissionStore from '../store/useSubmissionStore'

export default function SubmitWidget() {
  const [input, setInput] = useState('')
  const [status, setStatus] = useState('')

  const addSubmission = useSubmissionStore((state) => state.addSubmission)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      const response = await fetch('http://localhost:5000/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: input }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit')
      }

      const data = await response.json()

      addSubmission(data.submittedText)
      setStatus(`Submitted: ${data.submittedText}`)
      setInput('')
    } catch {
      setStatus('Could not submit data')
    }
  }

  return (
    <section>
      <h2 className='text-xl font-semibold mb-3'>Submit Widget</h2>

      <form onSubmit={handleSubmit} className='flex flex-col gap-2'>
        <input
          className='border border-gray-400 rounded px-3 py-2'
          type='text'
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder='Enter some text'
        />

        <button
          className='cursor-pointer bg-cyan-400 text-black px-3 py-2 rounded'
          type='submit'
        >
          Submit to backend
        </button>
      </form>

      {status && <p className='mt-3'>{status}</p>}
    </section>
  )
}
