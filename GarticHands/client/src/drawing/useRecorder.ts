import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDrawingContext } from './DrawingContext'

interface UseRecorderOptions {
  /** Composite output width in pixels. Default 640. */
  width?: number
  /** Composite output height in pixels. Default 480. */
  height?: number
  /** Capture frame rate. Default 30. */
  fps?: number
}

interface UseRecorderApi {
  /** Begin recording. Safe to call repeatedly; second call while recording is a no-op. */
  start: () => void
  /**
   * Stop recording. Resolves with the final blob URL, or `null` if nothing was
   * being recorded (so callers can always await it without first checking
   * `isRecording`).
   */
  stop: () => Promise<string | null>
  /** True if `MediaRecorder` is available in this browser. */
  isSupported: boolean
}

interface UseRecorderResult extends UseRecorderApi {
  /** True between `start()` and `stop()`. Reactive — use in render. */
  isRecording: boolean
  /** Most recent blob URL produced by `stop()`. Reactive — use in render. */
  lastBlobUrl: string | null
}

const MIME_CANDIDATES = [
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
  'video/mp4',
]

function pickMimeType(): string | null {
  if (typeof MediaRecorder === 'undefined') return null
  for (const mime of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(mime)) return mime
  }
  return null
}

/**
 * Records the user's drawing session as a webm video. Each frame composites the
 * **drawing canvas** as the main subject with the **camera canvas** in the
 * bottom-right corner (Gartic-Phone-style picture-in-picture).
 *
 * Lives off-DOM via an offscreen `<canvas>` whose `captureStream()` feeds a
 * `MediaRecorder`. Both canvases are sourced from the surrounding
 * `<DrawingProvider>` via `getPrimaryDrawCanvas()` and `getCameraCanvas()`, so
 * the hook doesn't care which layout (split / overlay / both) the page chose.
 *
 * The returned `start` / `stop` / `isSupported` are bundled into a stable API
 * object (`useMemo` over their refs), so consumers can list the recorder in a
 * `useEffect` deps list without forcing the effect to re-run on every render.
 * Reactive state (`isRecording`, `lastBlobUrl`) lives outside that memo so
 * render code still sees fresh values.
 *
 * `stop()` always resolves — it returns `null` if there was no active recording,
 * so callers can just `await recorder.stop()` without guarding on state.
 */
export function useRecorder({
  width = 640,
  height = 480,
  fps = 30,
}: UseRecorderOptions = {}): UseRecorderResult {
  const { getPrimaryDrawCanvas, getCameraCanvas } = useDrawingContext()

  const compositeRef = useRef<HTMLCanvasElement | null>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const rafRef = useRef<number | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  // Stable refs to the canvas-getters so the render loop reads the latest
  // without re-creating the captured closure on every render.
  const getDrawRef = useRef(getPrimaryDrawCanvas)
  const getCamRef = useRef(getCameraCanvas)
  useEffect(() => {
    getDrawRef.current = getPrimaryDrawCanvas
    getCamRef.current = getCameraCanvas
  }, [getPrimaryDrawCanvas, getCameraCanvas])

  const [isRecording, setIsRecording] = useState(false)
  const [lastBlobUrl, setLastBlobUrl] = useState<string | null>(null)
  const [isSupported] = useState(() => pickMimeType() !== null)

  // Allocate the offscreen composite canvas once.
  useEffect(() => {
    const c = document.createElement('canvas')
    c.width = width
    c.height = height
    compositeRef.current = c
    ctxRef.current = c.getContext('2d')
    return () => {
      compositeRef.current = null
      ctxRef.current = null
    }
  }, [width, height])

  // Composite the drawing canvas (full-frame) with the camera canvas (PiP corner).
  const renderFrame = useCallback(() => {
    const ctx = ctxRef.current
    const composite = compositeRef.current
    if (!ctx || !composite) return

    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, composite.width, composite.height)

    const draw = getDrawRef.current()
    if (draw && draw.width > 0 && draw.height > 0) {
      ctx.drawImage(draw, 0, 0, composite.width, composite.height)
    }

    const cam = getCamRef.current()
    if (cam && cam.width > 0 && cam.height > 0) {
      const cw = Math.round(composite.width * 0.3)
      const ch = Math.round(cw * (cam.height / cam.width))
      const x = composite.width - cw - 12
      const y = composite.height - ch - 12

      ctx.save()
      ctx.shadowColor = 'rgba(0,0,0,0.4)'
      ctx.shadowBlur = 8
      ctx.fillStyle = 'white'
      ctx.fillRect(x - 3, y - 3, cw + 6, ch + 6)
      ctx.restore()

      ctx.drawImage(cam, x, y, cw, ch)
    }
  }, [])

  const start = useCallback(() => {
    if (recorderRef.current || !isSupported) return
    const composite = compositeRef.current
    if (!composite) return

    const mime = pickMimeType()
    if (!mime) return

    const stream = composite.captureStream(fps)
    let recorder: MediaRecorder
    try {
      recorder = new MediaRecorder(stream, { mimeType: mime })
    } catch (e) {
      console.warn('[useRecorder] MediaRecorder construction failed:', e)
      return
    }
    recorderRef.current = recorder
    chunksRef.current = []

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.start(250) // collect a chunk every 250ms

    const loop = () => {
      if (!recorderRef.current) return
      renderFrame()
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    setIsRecording(true)
  }, [fps, renderFrame, isSupported])

  const stop = useCallback((): Promise<string | null> => {
    const recorder = recorderRef.current
    // No active recorder → resolve null so callers can always `await stop()`
    // without first checking `isRecording`.
    if (!recorder) return Promise.resolve(null)

    return new Promise<string | null>((resolve) => {
      recorder.onstop = () => {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current)
          rafRef.current = null
        }
        const chunks = chunksRef.current
        const mime = recorder.mimeType || 'video/webm'
        const blob = new Blob(chunks, { type: mime })
        chunksRef.current = []
        recorderRef.current = null
        setIsRecording(false)

        if (blob.size === 0) {
          resolve(null)
          return
        }
        const url = URL.createObjectURL(blob)
        // We keep `lastBlobUrl` for callers that want to read the latest in
        // render. Note: URL ownership transfers to the caller — they should
        // store it (e.g. in `RecordingsContext`) and revoke it themselves.
        setLastBlobUrl(url)
        resolve(url)
      }
      recorder.stop()
    })
  }, [])

  // Safety net — stop the recorder on unmount so we don't leave a dangling one.
  // Does NOT save the blob anywhere (no onstop handler set), so it's only for
  // resource cleanup when the user navigates away without submitting.
  useEffect(() => {
    return () => {
      if (recorderRef.current) {
        try {
          recorderRef.current.stop()
        } catch {
          /* ignore */
        }
      }
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Stable API surface — `start` / `stop` / `isSupported` don't change across
  // renders, so listing this object in a useEffect deps is safe.
  const api = useMemo<UseRecorderApi>(
    () => ({ start, stop, isSupported }),
    [start, stop, isSupported],
  )

  return { ...api, isRecording, lastBlobUrl }
}
