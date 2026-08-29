import path from 'node:path'
import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config for the Gartic Hands end-to-end suite.
 *
 * Run from the `GarticHands/` workspace root:
 *   npm run test:e2e
 *
 * Starts both the Express/Socket.IO server (:3000) and the Vite client (:5173)
 * automatically, and reuses them if they're already running (handy for local
 * `npm run dev` + fast test iteration).
 */
export default defineConfig({
    testDir: '.',
    // Explicit absolute paths — otherwise these resolve against the process's
    // cwd (the `GarticHands/` root when run via `npm run test:e2e`) instead of
    // this config file's directory, scattering output outside `e2e-tests/`.
    outputDir: path.join(__dirname, 'test-results'),
    timeout: 30_000,
    expect: { timeout: 5_000 },
    fullyParallel: false,
    workers: 1,
    retries: 0,
    reporter: [
        ['html', { open: 'never', outputFolder: path.join(__dirname, 'playwright-report') }],
        ['list'],
    ],

    use: {
        baseURL: 'http://localhost:5173',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'off',
        // Grants camera + clipboard without OS prompts; feeds a black synthetic
        // webcam frame so pages that mount the real camera pipeline don't hang.
        permissions: ['clipboard-read', 'clipboard-write', 'camera'],
        launchOptions: {
            args: [
                '--use-fake-device-for-media-stream',
                '--use-fake-ui-for-media-stream',
            ],
        },
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    webServer: [
        {
            command: 'npm run start -w @gartichands/server',
            cwd: '..',
            url: 'http://localhost:3000',
            reuseExistingServer: true,
            timeout: 30_000,
        },
        {
            command: 'npm run dev -w @gartichands/client',
            cwd: '..',
            url: 'http://localhost:5173',
            reuseExistingServer: true,
            timeout: 30_000,
        },
    ],
})
