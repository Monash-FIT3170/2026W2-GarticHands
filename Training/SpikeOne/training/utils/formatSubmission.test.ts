import { describe, expect, it } from 'vitest'
import { formatSubmission } from './formatSubmission'

describe('formatSubmission', () => {
  it('removes extra spaces from a submission', () => {
    expect(formatSubmission('  hello  ')).toBe('HELLO')
  })

  it('intentionally failing test first', () => {
    expect(formatSubmission('hello')).toBe('HELLO')
  })
})