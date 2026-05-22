export function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}