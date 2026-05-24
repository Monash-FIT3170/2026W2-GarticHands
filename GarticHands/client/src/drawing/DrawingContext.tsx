import { createContext, useCallback, useRef, useContext, type ReactNode } from 'react'
import type { CanvasHandle } from './components/Canvas'
import type { HandLandmark } from './Models/HandLandmark'
import type { GestureType } from './gestures/GestureTypes'

interface DrawingContextValue {
  /** Camera input pushes a frame here. Internal — `<DrawingCameraInput>` calls it. */
  pushFrame: (landmarks: HandLandmark[] | null, gesture: GestureType) => void
  /** Canvas registers its imperative handle so the provider can forward frames. */
  registerCanvas: (handle: CanvasHandle | null) => void
  /**
   * Snapshot the current canvas content as a PNG data URL. Returns `null` if the
   * canvas isn't mounted yet. Used at submit time on `/draw`.
   */
  getDrawingImage: () => string | null
}

const DrawingContext = createContext<DrawingContextValue | null>(null)

interface DrawingProviderProps {
  children: ReactNode
}

/**
 * Wires hand-tracking frames to a canvas. Put it around `<DrawingCameraInput />` and
 * `<DrawingCameraCanvas />` — the two components communicate through context, so
 * pages don't have to manage refs or callbacks.
 *
 * ```tsx
 * <DrawingProvider>
 *   <DrawingCameraInput />
 *   <DrawingCameraCanvas />
 * </DrawingProvider>
 * ```
 *
 * Use `useDrawing()` from within the provider to grab the drawing image at submit
 * time: `const { getDrawingImage } = useDrawing()`.
 */
export function DrawingProvider({ children }: DrawingProviderProps) {
  const canvasRef = useRef<CanvasHandle | null>(null)

  const pushFrame = useCallback(
    (landmarks: HandLandmark[] | null, gesture: GestureType) => {
      canvasRef.current?.onFrame(landmarks, gesture)
    },
    [],
  )

  const registerCanvas = useCallback((handle: CanvasHandle | null) => {
    canvasRef.current = handle
  }, [])

  const getDrawingImage = useCallback(() => {
    return canvasRef.current?.getImage() ?? null
  }, [])

  return (
    <DrawingContext.Provider value={{ pushFrame, registerCanvas, getDrawingImage }}>
      {children}
    </DrawingContext.Provider>
  )
}

/** Internal hook used by `<DrawingCameraInput>` and `<DrawingCameraCanvas>`. */
export function useDrawingContext(): DrawingContextValue {
  const ctx = useContext(DrawingContext)
  if (!ctx) {
    throw new Error(
      'DrawingCameraInput / DrawingCameraCanvas must be wrapped in <DrawingProvider>.',
    )
  }
  return ctx
}

/**
 * Public hook for pages — grab the canvas snapshot when submitting.
 *
 * ```tsx
 * const { getDrawingImage } = useDrawing()
 * const dataUrl = getDrawingImage()
 * ```
 */
export function useDrawing() {
  const { getDrawingImage } = useDrawingContext()
  return { getDrawingImage }
}
