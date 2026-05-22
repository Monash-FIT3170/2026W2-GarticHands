import { describe, it, expect } from 'vitest'
import { formatDate } from './formatDate'

describe('formatDate', () => {
  it('formats an ISO date string to readable format', () => {
    const result = formatDate('2025-03-15T10:30:00.000Z')
    expect(result).toContain('Mar')
    expect(result).toContain('2025')
  })

  it('handles an invalid date gracefully', () => {
    const result = formatDate('not-a-date')
    expect(result).toBe('Invalid Date')
  })
})