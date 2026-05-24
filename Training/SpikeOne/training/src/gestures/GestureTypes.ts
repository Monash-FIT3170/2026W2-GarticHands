// defines gestures

export const GestureType = {
  NONE: 'NONE',
  OPEN_PALM: 'OPEN_PALM',
  PINCH: 'PINCH',
} as const;

export type GestureType =
  (typeof GestureType)[keyof typeof GestureType];