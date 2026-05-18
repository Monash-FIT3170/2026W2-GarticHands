import { useEffect, useRef, useState } from 'react'
import {
  HandLandmarker,
  FilesetResolver,
} from '@mediapipe/tasks-vision'
import type { GestureType } from '../gestures/GestureTypes'
import { GestureType as GestureTypeEnum } from '../gestures/GestureTypes'
import { detectGesture } from '../gestures/GestureRecogniser'
import { GestureBuffer } from '../utils/gestureBuffer'
import { drawLandmarks, drawConnections } from '../utils/drawHand'
import type { HandLandmark } from '../Models/HandLandmark'

interface UseHandTrackingOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  onFrame?: (landmarks: HandLandmark[] | null, gesture: GestureType) => void
}

interface UseHandTrackingResult {
  isLoading: boolean
  error: string | null
  handDetected: boolean
  gesture: GestureType
}

export function useHandTracking({
  videoRef,
  canvasRef,
  onFrame,
}: UseHandTrackingOptions): UseHandTrackingResult {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [handDetected, setHandDetected] = useState(false)
  const [gesture, setGesture] = useState<GestureType>(GestureTypeEnum.NO_HAND)

  const onFrameRef = useRef(onFrame)
  useEffect(() => {
    onFrameRef.current = onFrame
  }, [onFrame])

  useEffect(() => {
    let cancelled = false
    let frameId: number
    let handLandmarker: HandLandmarker | null = null
    const gestureBuffer = new GestureBuffer(5)

    const processFrame = () => {
      if (cancelled) return

      const video = videoRef.current
      const canvas = canvasRef.current

      if (!video || !canvas || !handLandmarker || video.readyState < 2) {
        frameId = requestAnimationFrame(processFrame)
        return
      }

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Set canvas size once — not every frame.
      // Canvas clears when width/height is assigned so we only do it
      // when the video dimensions actually change.
      if (
        canvas.width !== video.videoWidth ||
        canvas.height !== video.videoHeight
      ) {
        canvas.width = video.videoWidth || 640
        canvas.height = video.videoHeight || 480
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Mirror the canvas once per frame via context transform.
      // CSS transform: scaleX(-1) is NOT applied to the canvas element
      // so there is only one mirror — no double-flip.
      ctx.save()
      ctx.scale(-1, 1)
      ctx.translate(-canvas.width, 0)
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Detect hands — synchronous in tasks-vision
      const results = handLandmarker.detectForVideo(video, performance.now())
      const detected = (results.landmarks?.length ?? 0) > 0

      setHandDetected(prev => prev !== detected ? detected : prev)

      if (detected) {
        const landmarks = results.landmarks[0] as HandLandmark[]
        const rawGesture = detectGesture(landmarks)
        const stableGesture = gestureBuffer.push(rawGesture)

        setGesture(prev => prev !== stableGesture ? stableGesture : prev)
        onFrameRef.current?.(landmarks, stableGesture)

        drawConnections(ctx, landmarks)
        drawLandmarks(ctx, landmarks)
      } else {
        gestureBuffer.clear()
        setGesture(prev =>
          prev !== GestureTypeEnum.NO_HAND ? GestureTypeEnum.NO_HAND : prev
        )
        onFrameRef.current?.(null, GestureTypeEnum.NO_HAND)
      }

      ctx.restore()

      frameId = requestAnimationFrame(processFrame)
    }

    const start = async () => {
      try {
        // Load MediaPipe tasks-vision WASM
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
        )

        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1, // was 2 but only [0] was ever read — saves compute
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        })

        if (cancelled) return

        // Start webcam
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        })

        if (cancelled) {
          stream.getTracks().forEach(t => t.stop())
          return
        }

        const video = videoRef.current
        if (!video) return

        video.srcObject = stream

        await new Promise<void>(resolve => {
          video.onloadedmetadata = async () => {
            await video.play()
            resolve()
          }
        })

        if (cancelled) return

        setIsLoading(false)
        frameId = requestAnimationFrame(processFrame)
      } catch (err) {
        if (!cancelled) {
          setError('Failed to start hand tracking: ' + (err as Error).message)
          setIsLoading(false)
        }
      }
    }

    start()

    return () => {
      cancelled = true
      cancelAnimationFrame(frameId)
      handLandmarker?.close()

      const stream = videoRef.current?.srcObject as MediaStream | null
      stream?.getTracks().forEach(t => t.stop())
    }
  }, [])

  return { isLoading, error, handDetected, gesture }
}