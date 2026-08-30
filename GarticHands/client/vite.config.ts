import { defineConfig } from 'vite';
// Side-effect import: augments Vite's config type with the `test` key below.
import 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  test: {
    coverage: {
      include: [
        'src/api/room.ts',
        'src/data/prompts.ts',
        'src/drawing/components/CanvasOperations/*',
        'src/drawing/components/constants/handConnections.ts',
        'src/drawing/gestures/**/*',
        'src/drawing/hooks/useHandTracking.ts',
        'src/drawing/Models/*',
        'src/drawing/utils/*',
      ],
      exclude: ['src/**/*.md'],
    },
  },
});
