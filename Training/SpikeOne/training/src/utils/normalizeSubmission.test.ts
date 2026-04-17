import { describe, it, expect } from 'vitest'
import { normalizeSubmission } from './normalizeSubmission'

describe('normalizeSubmission', () => {
  it('trims whitespace', () => {
    expect(normalizeSubmission('  hello  ')).toBe('hello')
  })

  it('throws on empty input', () => {
    expect(() => normalizeSubmission('   ')).toThrow()
  })
})

