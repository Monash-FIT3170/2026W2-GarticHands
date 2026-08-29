import { describe, it, expect } from 'vitest'
import { HAND_CONNECTIONS } from '../src/drawing/constants/handConnections'

describe('HAND_CONNECTIONS', () => {
  it('has exactly 21 connection pairs', () => {
    expect(HAND_CONNECTIONS).toHaveLength(21)
  })

  it('only references valid MediaPipe landmark indices (0-20)', () => {
    for (const [a, b] of HAND_CONNECTIONS) {
      expect(a).toBeGreaterThanOrEqual(0)
      expect(a).toBeLessThanOrEqual(20)
      expect(b).toBeGreaterThanOrEqual(0)
      expect(b).toBeLessThanOrEqual(20)
    }
  })

  it('contains no duplicate pairs', () => {
    const seen = new Set(HAND_CONNECTIONS.map(([a, b]) => `${a}-${b}`))
    expect(seen.size).toBe(HAND_CONNECTIONS.length)
  })

  it('does not connect a landmark to itself', () => {
    for (const [a, b] of HAND_CONNECTIONS) {
      expect(a).not.toBe(b)
    }
  })
})