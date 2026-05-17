export const GestureType = {
  NO_HAND: 'NO_HAND',
  HAND_PRESENT: 'HAND_PRESENT',
  PINCH: 'PINCH',
  OPEN_PALM: 'OPEN_PALM',
} as const;

export type GestureType = (typeof GestureType)[keyof typeof GestureType];
