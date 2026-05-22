import { create } from 'zustand'

interface Submission {
  id: string
  content: string
  createdAt: string
}

interface SubmissionStore {
  submissions: Submission[]
  addSubmission: (submission: Submission) => void
  setSubmissions: (submissions: Submission[]) => void
}

const useSubmissionStore = create<SubmissionStore>((set) => ({
  submissions: [],
  addSubmission: (submission) =>
    set((state) => ({
      submissions: [...state.submissions, submission]
    })),
  setSubmissions: (submissions) =>
    set({ submissions })
}))

export default useSubmissionStore
