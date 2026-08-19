// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useHandTracking } from '../src/drawing/hooks/useHandTracking'

// Mock the MediaPipe package
const detectForVideo = vi.fn().mockReturnValue({ landmarks: [] })
const close = vi.fn()
const createFromOptions = vi.fn().mockResolvedValue({ detectForVideo, close })

vi.mock('@mediapipe/tasks-vision', () => ({
  FilesetResolver: {
    forVisionTasks: vi.fn().mockResolvedValue({}),
  },
  HandLandmarker: {
    createFromOptions: (...args: unknown[]) => createFromOptions(...args),
  },
}))

// Mock the animation frame loop so tests control frame stepping
let rafCallback: FrameRequestCallback | null = null
function stubAnimationFrame() {
  rafCallback = null
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    rafCallback = cb
    return 1
  })
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
}
function stepFrame() {
  act(() => {
    const cb = rafCallback
    rafCallback = null
    cb?.(0)
  })
}

// Fake video/canvas elements
function createRefs() {
  const tracks = [{ stop: vi.fn() }]
  const stream = { getTracks: () => tracks } as unknown as MediaStream

  const video = {
    readyState: 2,
    videoWidth: 640,
    videoHeight: 480,
    srcObject: null as unknown,
    onloadedmetadata: null as (() => void) | null,
    play: vi.fn().mockResolvedValue(undefined),
  } as unknown as HTMLVideoElement

  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(),
  } as unknown as HTMLCanvasElement

  const ctx = {
    canvas,
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
    drawImage: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
  }
  vi.mocked(canvas.getContext).mockReturnValue(ctx as unknown as CanvasRenderingContext2D)

  return {
    videoRef: { current: video },
    canvasRef: { current: canvas },
    video,
    canvas,
    ctx,
    stream,
    tracks,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  detectForVideo.mockReturnValue({ landmarks: [] })
  createFromOptions.mockResolvedValue({ detectForVideo, close })
  stubAnimationFrame()
  vi.stubGlobal('navigator', {
    mediaDevices: {
      getUserMedia: vi.fn(),
    },
  })
})

// Drives the hook's start() sequence up to (and including) the point where
// getUserMedia resolves and the video's onloadedmetadata fires
async function startAndConnectStream(refs: ReturnType<typeof createRefs>) {
  vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValue(refs.stream)

  const rendered = renderHook(() =>
    useHandTracking({ videoRef: refs.videoRef, canvasRef: refs.canvasRef })
  )

  await waitFor(() => expect(refs.video.onloadedmetadata).not.toBeNull())

  await act(async () => {
    await refs.video.onloadedmetadata?.(new Event('loadedmetadata'))
  })

  return rendered
}

describe('useHandTracking', () => {
  it('falls back to the CPU delegate when the GPU delegate fails to create', async () => {
    createFromOptions
      .mockRejectedValueOnce(new Error('GPU unavailable'))
      .mockResolvedValueOnce({ detectForVideo, close })

    const refs = createRefs()
    await startAndConnectStream(refs)

    await waitFor(() => expect(createFromOptions).toHaveBeenCalledTimes(2))

    expect(createFromOptions.mock.calls[0][1].baseOptions.delegate).toBe('GPU')
    expect(createFromOptions.mock.calls[1][1].baseOptions.delegate).toBe('CPU')
  })

  it('sets an error and stops loading when getUserMedia is rejected', async () => {
    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(
      new Error('permission denied')
    )
    const refs = createRefs()

    const { result } = renderHook(() =>
      useHandTracking({ videoRef: refs.videoRef, canvasRef: refs.canvasRef })
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toContain('permission denied')
  })

  it('stops loading once the stream connects and playback starts', async () => {
    const refs = createRefs()
    const { result } = await startAndConnectStream(refs)

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(refs.video.play).toHaveBeenCalled()
  })

  it('invokes onFrame with landmarks and pushes the gesture when a hand is detected', async () => {
    detectForVideo.mockReturnValue({
      landmarks: [Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }))],
    })
    const onFrame = vi.fn()
    const refs = createRefs()
    vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValue(refs.stream)

    renderHook(() =>
      useHandTracking({ videoRef: refs.videoRef, canvasRef: refs.canvasRef, onFrame })
    )

    await waitFor(() => expect(refs.video.onloadedmetadata).not.toBeNull())
    await act(async () => {
    await refs.video.onloadedmetadata?.(new Event('loadedmetadata'))
    })
    await waitFor(() => expect(rafCallback).not.toBeNull())
    stepFrame()

    await waitFor(() => expect(onFrame).toHaveBeenCalled())
    const [landmarks, gesture] = onFrame.mock.calls[0]
    expect(landmarks).not.toBeNull()
    expect(gesture).toBeDefined()
  })

  it('invokes onFrame with null/NO_HAND and clears the gesture buffer when no hand is detected', async () => {
    detectForVideo.mockReturnValue({ landmarks: [] })
    const onFrame = vi.fn()
    const refs = createRefs()
    vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValue(refs.stream)

    renderHook(() =>
      useHandTracking({ videoRef: refs.videoRef, canvasRef: refs.canvasRef, onFrame })
    )

    await waitFor(() => expect(refs.video.onloadedmetadata).not.toBeNull())
    await act(async () => {
    await refs.video.onloadedmetadata?.(new Event('loadedmetadata'))
    })
    await waitFor(() => expect(rafCallback).not.toBeNull())
    stepFrame()

    await waitFor(() => expect(onFrame).toHaveBeenCalledWith(null, 'NO_HAND'))
  })

  it('stops media tracks and closes the landmarker on unmount', async () => {
    const refs = createRefs()
    const { unmount } = await startAndConnectStream(refs)

    unmount()

    expect(refs.tracks[0].stop).toHaveBeenCalled()
    expect(close).toHaveBeenCalled()
  })
})