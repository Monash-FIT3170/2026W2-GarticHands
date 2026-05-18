import { HAND_CONNECTIONS } from '../constants/handConnections'
import type { HandLandmark } from '../Models/HandLandmark'

// Draws red dots at each of the 21 landmark positions.
export function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: HandLandmark[]
): void {
  ctx.fillStyle = 'red'

  for (const lm of landmarks) {
    ctx.beginPath()
    ctx.arc(
      lm.x * ctx.canvas.width,
      lm.y * ctx.canvas.height,
      4,
      0,
      Math.PI * 2
    )
    ctx.fill()
  }
}

// Draws lime-green lines between connected landmark pairs.
export function drawConnections(
  ctx: CanvasRenderingContext2D,
  landmarks: HandLandmark[]
): void {
  ctx.strokeStyle = 'lime'
  ctx.lineWidth = 2

  for (const [a, b] of HAND_CONNECTIONS) {
    const p1 = landmarks[a]
    const p2 = landmarks[b]

    ctx.beginPath()
    ctx.moveTo(p1.x * ctx.canvas.width, p1.y * ctx.canvas.height)
    ctx.lineTo(p2.x * ctx.canvas.width, p2.y * ctx.canvas.height)
    ctx.stroke()
  }
}