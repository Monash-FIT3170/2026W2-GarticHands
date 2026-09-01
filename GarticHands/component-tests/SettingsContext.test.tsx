/**
 * SettingsContext.test.tsx
 *
 * Provider and hook tests for SettingsProvider / useSettings
 * (client/src/state/SettingsContext).
 *
 * The provider owns the colour-vision mode (User Story 25). It reads any
 * persisted mode from localStorage on mount, mirrors the active mode onto
 * <html data-color-vision="..."> so the attribute-scoped palette overrides
 * in index.css apply, and persists changes back to localStorage. In the
 * default mode the attribute must be absent and the stored key removed,
 * so the default DOM is byte-identical to an unthemed app (this is what
 * keeps the us21 visual-regression baselines green).
 *
 * jsdom provides a working localStorage and documentElement, so both side
 * effects can be asserted directly. Storage and the attribute are reset
 * before each test so tests stay order-independent.
 */

import { renderHook, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import type { ReactNode } from 'react'
import {
  SettingsProvider,
  useSettings,
  COLOR_VISION_MODES,
  GESTURE_SENSITIVITIES,
  STROKE_SMOOTHING_LEVELS,
} from '../client/src/state/SettingsContext'

const STORAGE_KEY = 'gartichands.colorVision'
const SENSITIVITY_KEY = 'gartichands.gestureSensitivity'
const SMOOTHING_KEY = 'gartichands.strokeSmoothing'

const wrapper = ({ children }: { children: ReactNode }) => (
  <SettingsProvider>{children}</SettingsProvider>
)

describe('SettingsProvider / useSettings', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-color-vision')
  })

  test('exposes the four selectable modes with default first', () => {
    expect(COLOR_VISION_MODES).toEqual(['default', 'deuteranopia', 'protanopia', 'tritanopia'])
  })

  test('defaults to the default mode and leaves <html> untagged', () => {
    const { result } = renderHook(() => useSettings(), { wrapper })

    expect(result.current.colorVision).toBe('default')
    expect(document.documentElement.hasAttribute('data-color-vision')).toBe(false)
  })

  test('setColorVision tags <html> and persists the mode to localStorage', () => {
    const { result } = renderHook(() => useSettings(), { wrapper })

    act(() => {
      result.current.setColorVision('deuteranopia')
    })

    expect(result.current.colorVision).toBe('deuteranopia')
    expect(document.documentElement.getAttribute('data-color-vision')).toBe('deuteranopia')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('deuteranopia')
  })

  test('switching back to default removes the attribute and the stored value', () => {
    const { result } = renderHook(() => useSettings(), { wrapper })

    act(() => {
      result.current.setColorVision('tritanopia')
    })
    act(() => {
      result.current.setColorVision('default')
    })

    expect(result.current.colorVision).toBe('default')
    expect(document.documentElement.hasAttribute('data-color-vision')).toBe(false)
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  test('restores a persisted mode on mount', () => {
    localStorage.setItem(STORAGE_KEY, 'protanopia')

    const { result } = renderHook(() => useSettings(), { wrapper })

    expect(result.current.colorVision).toBe('protanopia')
    expect(document.documentElement.getAttribute('data-color-vision')).toBe('protanopia')
  })

  test('falls back to default when the stored value is garbage', () => {
    localStorage.setItem(STORAGE_KEY, 'vaporwave')

    const { result } = renderHook(() => useSettings(), { wrapper })

    expect(result.current.colorVision).toBe('default')
    expect(document.documentElement.hasAttribute('data-color-vision')).toBe(false)
  })

  test('useSettings throws when called outside the provider', () => {
    expect(() => renderHook(() => useSettings())).toThrow(
      'useSettings must be called inside <SettingsProvider>.',
    )
  })
})

describe('SettingsProvider drawing adjustments', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('exposes the selectable levels in panel order', () => {
    expect(GESTURE_SENSITIVITIES).toEqual(['low', 'default', 'high'])
    expect(STROKE_SMOOTHING_LEVELS).toEqual(['light', 'default', 'strong'])
  })

  test('defaults both adjustments and keeps their storage keys empty', () => {
    const { result } = renderHook(() => useSettings(), { wrapper })

    expect(result.current.gestureSensitivity).toBe('default')
    expect(result.current.strokeSmoothing).toBe('default')
    expect(localStorage.getItem(SENSITIVITY_KEY)).toBeNull()
    expect(localStorage.getItem(SMOOTHING_KEY)).toBeNull()
  })

  test('setGestureSensitivity updates the value and persists it', () => {
    const { result } = renderHook(() => useSettings(), { wrapper })

    act(() => {
      result.current.setGestureSensitivity('high')
    })

    expect(result.current.gestureSensitivity).toBe('high')
    expect(localStorage.getItem(SENSITIVITY_KEY)).toBe('high')
  })

  test('setStrokeSmoothing updates the value and persists it', () => {
    const { result } = renderHook(() => useSettings(), { wrapper })

    act(() => {
      result.current.setStrokeSmoothing('strong')
    })

    expect(result.current.strokeSmoothing).toBe('strong')
    expect(localStorage.getItem(SMOOTHING_KEY)).toBe('strong')
  })

  test('switching back to default removes the stored values', () => {
    const { result } = renderHook(() => useSettings(), { wrapper })

    act(() => {
      result.current.setGestureSensitivity('low')
      result.current.setStrokeSmoothing('light')
    })
    act(() => {
      result.current.setGestureSensitivity('default')
      result.current.setStrokeSmoothing('default')
    })

    expect(localStorage.getItem(SENSITIVITY_KEY)).toBeNull()
    expect(localStorage.getItem(SMOOTHING_KEY)).toBeNull()
  })

  test('restores persisted levels on mount', () => {
    localStorage.setItem(SENSITIVITY_KEY, 'low')
    localStorage.setItem(SMOOTHING_KEY, 'strong')

    const { result } = renderHook(() => useSettings(), { wrapper })

    expect(result.current.gestureSensitivity).toBe('low')
    expect(result.current.strokeSmoothing).toBe('strong')
  })

  test('falls back to default when the stored values are garbage', () => {
    localStorage.setItem(SENSITIVITY_KEY, 'ultra')
    localStorage.setItem(SMOOTHING_KEY, '9000')

    const { result } = renderHook(() => useSettings(), { wrapper })

    expect(result.current.gestureSensitivity).toBe('default')
    expect(result.current.strokeSmoothing).toBe('default')
  })

  test('the drawing adjustments do not disturb the colour-vision mode', () => {
    const { result } = renderHook(() => useSettings(), { wrapper })

    act(() => {
      result.current.setGestureSensitivity('high')
      result.current.setStrokeSmoothing('light')
    })

    expect(result.current.colorVision).toBe('default')
    expect(document.documentElement.hasAttribute('data-color-vision')).toBe(false)
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
