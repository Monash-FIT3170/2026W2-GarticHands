import { createContext, useCallback, useRef, useContext, type ReactNode } from 'react'
import type { CanvasHandle } from './components/Canvas'
import type { HandLandmark } from './Models/HandLandmark'
import type { GestureType } from './gestures/GestureTypes'

interface DrawingContextValue {
  /** Camera input pushes a frame here. Internal — `<DrawingCameraInput>` calls it. */
  pushFrame: (landmarks: HandLandmark[] | null, gesture: GestureType) => void
  /** Canvas registers its imperative handle so the provider can forward frames. */
  registerCanvas: (handle: CanvasHandle | null) => void
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

  return (
    <DrawingContext.Provider value={{ pushFrame, registerCanvas }}>
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
