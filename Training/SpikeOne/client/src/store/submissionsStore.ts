import { create } from 'zustand'

interface Submission {
  id: string | number
  text: string
}

interface SubmissionsStore {
  submissions: Submission[]
  addSubmission: (text: string) => void
  setSubmissions: (submissions: Submission[]) => void
}

export const useSubmissionsStore = create<SubmissionsStore>((set) => ({
  submissions: [],
  addSubmission: (text) =>
    set((state) => ({
      submissions: [{ id: Date.now(), text }, ...state.submissions]
    })),
  setSubmissions: (submissions) => set({ submissions })
}))