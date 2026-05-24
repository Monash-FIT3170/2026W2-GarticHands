import { useEffect, useRef } from 'react'
import Canvas, { type CanvasHandle } from './Canvas'
import { useDrawingContext } from '../DrawingContext'

interface DrawingCameraCanvasProps {
  width?: number
  height?: number
  /** Stroke color (default 'black'). Switch to e.g. 'white' for camera overlay. */
  strokeColor?: string
  /** Wrapper class override — pass `absolute inset-0` for overlay use. */
  className?: string
}

/**
 * Drawing surface that consumes frames from `<DrawingCameraInput>` via the shared
 * `<DrawingProvider>` context. Multiple instances in one provider render the
 * same strokes — useful for split + overlay views side by side.
 *
 * The first instance mounted is the **primary** canvas (its image is what gets
 * submitted via `useDrawing().getDrawingImage()`). Mount the canvas you want
 * submitted first.
 */
export default function DrawingCameraCanvas({
  width,
  height,
  strokeColor,
  className,
}: DrawingCameraCanvasProps) {
  const { registerCanvas } = useDrawingContext()
  const canvasRef = useRef<CanvasHandle>(null)

  useEffect(() => {
    const handle = canvasRef.current
    if (!handle) return
    const unregister = registerCanvas(handle)
    return unregister
  }, [registerCanvas])

  return (
    <Canvas
      ref={canvasRef}
      width={width}
      height={height}
      strokeColor={strokeColor}
      className={className}
    />
  )
}
