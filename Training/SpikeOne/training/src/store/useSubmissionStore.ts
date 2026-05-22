import { create } from 'zustand'

interface SubmissionStore {
  submissions: string[]
  addSubmission: (submission: string) => void
}

const useSubmissionStore = create<SubmissionStore>((set) => ({
  submissions: [],
  addSubmission: (submission) =>
    set((state) => ({
      submissions: [submission, ...state.submissions],
    })),
}))

export default useSubmissionStore