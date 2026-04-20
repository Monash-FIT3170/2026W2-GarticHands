// Pure utility function used by widgets/store.
export function normalizeSubmission(input: string): string {
  const trimmed = input.trim()
  if (trimmed.length === 0) throw new Error('Submission cannot be empty')
  return trimmed
}

