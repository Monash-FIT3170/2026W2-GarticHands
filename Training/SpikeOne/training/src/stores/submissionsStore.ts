import { create } from 'zustand'

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

type SubmissionsState = {
  recent: string[]
  status: SubmitStatus
  error: string | null
  addLocalSubmission: (submission: string) => void
  submitToServer: (submission: string) => Promise<void>
}

export const useSubmissionsStore = create<SubmissionsState>((set) => ({
  recent: [],
  status: 'idle',
  error: null,

  addLocalSubmission: (submission) =>
    set((s) => ({ recent: [submission, ...s.recent].slice(0, 10) })),

  submitToServer: async (submission) => {
    set({ status: 'submitting', error: null })
    try {
      const res = await fetch('http://localhost:4000/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission }),
      })

      if (!res.ok) throw new Error(`Request failed: ${res.status}`)

      set((s) => ({
        recent: [submission, ...s.recent].slice(0, 10),
        status: 'success',
      }))

      window.setTimeout(() => set({ status: 'idle' }), 1200)
    } catch (err) {
      console.error('Submit failed', err)
      set({ status: 'error', error: 'Submit failed' })
    }
  },
}))

