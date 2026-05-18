import type { GestureType } from '../gestures/GestureTypes'

// A fixed-size rolling buffer that returns the most frequent
// gesture over the last N frames — prevents single-frame flicker.
// Extracted here so HandTracking.tsx doesn't contradict its own
// "no smoothing" header comment.
export class GestureBuffer {
  private buffer: GestureType[] = []
  private readonly size: number

  constructor(size: number = 5) {
    this.size = size
  }

  push(gesture: GestureType): GestureType {
    this.buffer.push(gesture)

    if (this.buffer.length > this.size) {
      this.buffer.shift()
    }

    return this.majority()
  }

  private majority(): GestureType {
    const counts = new Map<GestureType, number>()

    for (const g of this.buffer) {
      counts.set(g, (counts.get(g) ?? 0) + 1)
    }

    let best = this.buffer[0]
    let bestCount = 0

    for (const [g, count] of counts) {
      if (count > bestCount) {
        best = g
        bestCount = count
      }
    }

    return best
  }

  clear(): void {
    this.buffer = []
  }
}