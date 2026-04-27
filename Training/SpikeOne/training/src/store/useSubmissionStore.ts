import { create } from 'zustand'

interface Submission {
  _id: string,
  content: string,
  createdAt: string
}

interface SubmissionStore {
  submissions: Submission[]
  setSubmissions: (submissions: Submission[]) => void
  addSubmission: (submission: Submission) => void
}

const useSubmissionStore = create<SubmissionStore>((set) => ({
  
  submissions: [],

  setSubmissions: (submissions) => set({ submissions}),

  addSubmission: (submission) =>
    set((state) => ({
      submissions: [submission, ...state.submissions],
    })),

}))

export default useSubmissionStore