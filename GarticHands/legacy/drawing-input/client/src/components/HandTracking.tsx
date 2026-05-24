import { useRef } from 'react'
import { useHandTracking } from '../hooks/useHandTracking'
import { GestureType } from '../gestures/GestureTypes'
import type { GestureType as GestureTypeValue } from '../gestures/GestureTypes'
import type { HandLandmark } from '../Models/HandLandmark'

interface HandTrackingProps {
  onFrame?: (
    landmarks: HandLandmark[] | null,
    gesture: GestureTypeValue,
  ) => void
}

export default function HandTracking({ onFrame }: HandTrackingProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const { isLoading, error, handDetected, gesture } = useHandTracking({
    videoRef,
    canvasRef,
    onFrame,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
      <h2>Hand Tracking</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!error && (
        <>
          <p>
            {isLoading
              ? 'Loading camera and model...'
              : handDetected
              ? '✅ Hand detected'
              : '👋 No hand detected'}
          </p>
          <p>Gesture: <b>{gesture}</b></p>
        </>
      )}

      {/* Hidden raw webcam — display:none can throttle in some browsers;
          visibility:hidden keeps it active but invisible */}
      <video
        ref={videoRef}
        playsInline
        muted
        style={{ visibility: 'hidden', position: 'absolute' }}
      />

      {/* No CSS scaleX(-1) here — mirroring is done once in the canvas context */}
      <canvas
        ref={canvasRef}
        style={{ width: '640px', height: '480px', border: '2px solid gray' }}
      />
    </div>
  )
}