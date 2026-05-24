// Module-scope const — allocated once, never re-created per frame.
// Each pair is [landmarkIndexA, landmarkIndexB] using MediaPipe's
// 21-point hand model. See:
// https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/hands.md
export const HAND_CONNECTIONS: [number, number][] = [
  [0, 1],   [1, 2],   [2, 3],   [3, 4],   // thumb
  [0, 5],   [5, 6],   [6, 7],   [7, 8],   // index
  [5, 9],   [9, 10],  [10, 11], [11, 12], // middle
  [9, 13],  [13, 14], [14, 15], [15, 16], // ring
  [13, 17], [17, 18], [18, 19], [19, 20], // pinky
  [0, 17],                                 // palm base
]