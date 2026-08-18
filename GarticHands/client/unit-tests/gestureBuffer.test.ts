import { describe, it, expect} from 'vitest'
import { GestureBuffer } from '../src/drawing/utils/gestureBuffer.ts'
import { GestureType } from '../src/drawing/gestures/GestureTypes'

describe('GestureBuffer', () => {
  it('returns the pushed gesture when buffer has a single entry', () => {
    const buf = new GestureBuffer(5)
    const result = buf.push(GestureType.PINCH)
    expect(result).toBe(GestureType.PINCH)
  })

  it('returns the majority gesture across pushes', () => {
    const buf = new GestureBuffer(5)
    buf.push(GestureType.PINCH)
    buf.push(GestureType.PINCH)
    buf.push(GestureType.OPEN_PALM)
    const result = buf.push(GestureType.PINCH)
    expect(result).toBe(GestureType.PINCH)
  })

  it('evicts the oldest frame once size is exceeded', () => {
    const buf = new GestureBuffer(3)
    buf.push(GestureType.PINCH)
    buf.push(GestureType.PINCH)
    buf.push(GestureType.PINCH)
    // buffer is now [PINCH, PINCH, PINCH]; pushing two OPEN_PALM should
    // evict enough PINCH frames for OPEN_PALM to take the majority
    buf.push(GestureType.OPEN_PALM)
    const result = buf.push(GestureType.OPEN_PALM)
    // buffer is now [PINCH, OPEN_PALM, OPEN_PALM]
    expect(result).toBe(GestureType.OPEN_PALM)
  })

  it('drops frames older than the configured window size', () => {
    const buf = new GestureBuffer(2)
    buf.push(GestureType.PINCH)
    buf.push(GestureType.PINCH)
    // window is now full of PINCH; two more OPEN_PALM pushes should fully
    // flush PINCH out of a size-2 buffer
    buf.push(GestureType.OPEN_PALM)
    const result = buf.push(GestureType.OPEN_PALM)
    expect(result).toBe(GestureType.OPEN_PALM)
  })

  it('breaks ties by keeping the earliest-seen gesture with that count', () => {
    const buf = new GestureBuffer(2)
    buf.push(GestureType.PINCH)
    const result = buf.push(GestureType.OPEN_PALM)
    // [PINCH, OPEN_PALM] - tie of 1 each, first-seen (PINCH) should win
    // since majority() only overwrites `best` on a strictly greater count
    expect(result).toBe(GestureType.PINCH)
  })

  it('clear() empties the buffer so the next push starts fresh', () => {
    const buf = new GestureBuffer(5)
    buf.push(GestureType.PINCH)
    buf.push(GestureType.PINCH)
    buf.clear()
    const result = buf.push(GestureType.OPEN_PALM)
    expect(result).toBe(GestureType.OPEN_PALM)
  })
})