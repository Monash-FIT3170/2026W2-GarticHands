import { describe, it, expect } from 'vitest'
import { formatSubmission } from './formatSubmission'

describe('formatSubmission', () => {
  it('trims whitespace', () => {
    expect(formatSubmission('  hello  ')).toBe('hello')
  })

  it('lowercases text', () => {
    expect(formatSubmission('HELLO')).toBe('hello')
  })

  // intentionally failing test — fix by updating formatSubmission
  it('returns empty string for whitespace only', () => {
    expect(formatSubmission('   ')).toBe('')
  })
})