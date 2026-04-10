import { create } from 'zustand'

interface Submission {
  id: number
  text: string
}

interface SubmissionsStore {
  submissions: Submission[]
  addSubmission: (text: string) => void
}

export const useSubmissionsStore = create<SubmissionsStore>((set) => ({
  submissions: [],
  addSubmission: (text) =>
    set((state) => ({
      submissions: [
        { id: Date.now(), text },
        ...state.submissions,
      ]
    }))
}))