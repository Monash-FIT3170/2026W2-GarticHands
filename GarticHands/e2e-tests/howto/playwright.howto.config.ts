import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, devices } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Records the animated clips for the How to Play page. Not part of the test
 * suite — run it by hand when a flow changes:
 *
 *   npx playwright test --config=e2e-tests/howto/playwright.howto.config.ts
 *   python e2e-tests/howto/make_gifs.py
 *
 * Frames land in `e2e-tests/howto/frames/` (git-ignored); `make_gifs.py` turns
 * them into `client/public/howto/<clip>.gif` plus a `.png` still.
 *
 * Starts its own server with AI off (bots use the offline sketch bank, so the
 * clips are reproducible) and fast bots. Stop any running `npm run dev` first,
 * or the existing server — with its normal bot speed — is reused.
 */
export default defineConfig({
  testDir: '.',
  testMatch: 'record-howto.ts',
  outputDir: path.join(__dirname, 'test-results'),
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],

  use: {
    baseURL: 'http://localhost:5173',
    viewport: { width: 1280, height: 800 },
    permissions: ['clipboard-read', 'clipboard-write', 'camera'],
    launchOptions: {
      args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
    },
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } }],

  webServer: [
    {
      command: 'npm run start -w @gartichands/server',
      cwd: path.join(__dirname, '..', '..'),
      url: 'http://localhost:3000',
      reuseExistingServer: true,
      timeout: 30_000,
      env: { AI_ENABLED: 'false', BOT_DELAY_SCALE: '0.25' },
    },
    {
      command: 'npm run dev -w @gartichands/client',
      cwd: path.join(__dirname, '..', '..'),
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
});
