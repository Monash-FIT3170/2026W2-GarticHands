import { describe, it, expect } from 'vitest'
import { detectOpenPalm } from '../src/drawing/gestures/detectors/detectOpenPalm'
import type { HandLandmark } from '../src/drawing/Models/HandLandmark'

function baseLandmarks(): HandLandmark[] {
  return Array.from({ length: 21 }, () => ({ x: 0, y: 0.5, z: 0 }))
}

describe('detectOpenPalm', () => {
  it('returns true when all four fingertips sit above their bases', () => {
    const landmarks = baseLandmarks()
    for (const tip of [8, 12, 16, 20]) landmarks[tip].y = 0.1
    for (const base of [5, 9, 13, 17]) landmarks[base].y = 0.6
    expect(detectOpenPalm(landmarks)).toBe(true)
  })

  it('returns false when all fingertips are below their bases (fist)', () => {
    const landmarks = baseLandmarks()
    for (const tip of [8, 12, 16, 20]) landmarks[tip].y = 0.6
    for (const base of [5, 9, 13, 17]) landmarks[base].y = 0.1
    expect(detectOpenPalm(landmarks)).toBe(false)
  })

  it('returns false when only three of four fingers are extended', () => {
    const landmarks = baseLandmarks()
    for (const tip of [8, 12, 16, 20]) landmarks[tip].y = 0.1
    for (const base of [5, 9, 13, 17]) landmarks[base].y = 0.6
    // curl the pinky (tip 20) back down below its base
    landmarks[20].y = 0.7
    expect(detectOpenPalm(landmarks)).toBe(false)
  })

  it('treats an equal tip/base y as not extended (strict inequality)', () => {
    const landmarks = baseLandmarks()
    for (const tip of [8, 12, 16, 20]) landmarks[tip].y = 0.5
    for (const base of [5, 9, 13, 17]) landmarks[base].y = 0.5
    expect(detectOpenPalm(landmarks)).toBe(false)
  })
})