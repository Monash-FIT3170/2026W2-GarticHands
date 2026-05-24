import { useEffect, useRef } from 'react'
import Canvas, { type CanvasHandle } from './Canvas'
import { useDrawingContext } from '../DrawingContext'

interface DrawingCameraCanvasProps {
  width?: number
  height?: number
}

/**
 * Drawing surface that consumes frames from `<DrawingCameraInput>` via the shared
 * `<DrawingProvider>` context. Pages drop it in — no refs or callbacks needed.
 */
export default function DrawingCameraCanvas({ width, height }: DrawingCameraCanvasProps) {
  const { registerCanvas } = useDrawingContext()
  const canvasRef = useRef<CanvasHandle>(null)

  useEffect(() => {
    registerCanvas(canvasRef.current)
    return () => registerCanvas(null)
  }, [registerCanvas])

  return <Canvas ref={canvasRef} width={width} height={height} />
}
