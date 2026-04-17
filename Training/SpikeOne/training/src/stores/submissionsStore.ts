import { create } from 'zustand'

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

export type SubmissionDoc = {
  _id: string
  content: string
  createdAt: string
}

type SubmissionsState = {
  recent: SubmissionDoc[]
  status: SubmitStatus
  error: string | null
  fetchSubmissions: () => Promise<void>
  submitToServer: (submission: string) => Promise<void>
}

export const useSubmissionsStore = create<SubmissionsState>((set) => ({
  recent: [],
  status: 'idle',
  error: null,

  fetchSubmissions: async () => {
    try {
      const res = await fetch('http://localhost:4000/api/submissions')
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const data = (await res.json()) as SubmissionDoc[]
      set({ recent: data.slice(0, 25), error: null })
    } catch (err) {
      console.error('Fetch submissions failed', err)
      set({ error: 'Failed to load submissions' })
    }
  },

  submitToServer: async (submission) => {
    set({ status: 'submitting', error: null })
    try {
      const res = await fetch('http://localhost:4000/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission }),
      })

      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const created = (await res.json()) as SubmissionDoc

      set((s) => ({
        recent: [created, ...s.recent].slice(0, 25),
        status: 'success',
      }))

      window.setTimeout(() => set({ status: 'idle' }), 1200)
    } catch (err) {
      console.error('Submit failed', err)
      set({ status: 'error', error: 'Submit failed' })
    }
  },
}))

