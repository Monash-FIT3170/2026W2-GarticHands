/**
 * Records the How to Play clips — see `playwright.howto.config.ts` for how to
 * run it. Each test drives one real flow (hands are faked through the
 * `?e2e=hands` seam, bots fill the seats) while a background loop screenshots
 * the page. `make_gifs.py` then turns each folder of frames into a GIF.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { test, expect, type Page } from '@playwright/test';
import { handPresentLandmarks, pinchLandmarks } from '../helpers/gestures';
import { enableHandTrackingTestSeam, sendHandFrame } from '../helpers/game';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRAMES_DIR = path.join(__dirname, 'frames');

type Point = [number, number];

/** Screenshots `page` in a loop until stopped, then writes a timing manifest. */
class ClipRecorder {
  private readonly dir: string;
  private readonly frames: { file: string; at: number }[] = [];
  private running = false;
  private loop: Promise<void> = Promise.resolve();

  constructor(
    private readonly page: Page,
    clip: string,
  ) {
    this.dir = path.join(FRAMES_DIR, clip);
    fs.rmSync(this.dir, { recursive: true, force: true });
    fs.mkdirSync(this.dir, { recursive: true });
  }

  start() {
    this.running = true;
    this.loop = (async () => {
      while (this.running) {
        const file = `${String(this.frames.length).padStart(4, '0')}.png`;
        await this.page.screenshot({ path: path.join(this.dir, file) });
        this.frames.push({ file, at: Date.now() });
      }
    })();
  }

  async stop() {
    this.running = false;
    await this.loop;
    fs.writeFileSync(path.join(this.dir, 'frames.json'), JSON.stringify(this.frames, null, 2));
  }
}

async function record(page: Page, clip: string, body: () => Promise<void>) {
  const recorder = new ClipRecorder(page, clip);
  recorder.start();
  try {
    await body();
  } finally {
    await recorder.stop();
  }
}

const pause = (page: Page, ms: number) => page.waitForTimeout(ms);

/** Pen down along `points`, then lift the pen. Coordinates are normalised camera space. */
async function stroke(page: Page, points: Point[]) {
  for (const [x, y] of points) {
    await sendHandFrame(page, pinchLandmarks(x, y), 'PINCH');
    await page.waitForTimeout(18);
  }
  const [lx, ly] = points[points.length - 1];
  await sendHandFrame(page, handPresentLandmarks(lx, ly), 'HAND_PRESENT');
  await page.waitForTimeout(80);
}

function arc(cx: number, cy: number, rx: number, ry: number, from: number, to: number, steps = 36) {
  return Array.from({ length: steps + 1 }, (_, i): Point => {
    const a = ((from + ((to - from) * i) / steps) * Math.PI) / 180;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  });
}

/** A smiley face — simple, recognisable, and symmetric so mirroring doesn't matter. */
async function drawSmiley(page: Page) {
  await stroke(page, arc(0.5, 0.5, 0.17, 0.24, 0, 360, 48));
  await stroke(page, arc(0.44, 0.42, 0.015, 0.02, 0, 360, 10));
  await stroke(page, arc(0.56, 0.42, 0.015, 0.02, 0, 360, 10));
  await stroke(page, arc(0.5, 0.52, 0.09, 0.1, 20, 160, 20));
}

async function typeSlowly(page: Page, text: string) {
  await page.keyboard.type(text, { delay: 45 });
}

async function enterName(page: Page, name: string) {
  await page.goto('/');
  await page.getByPlaceholder('Enter username...').click();
  await typeSlowly(page, name);
}

/** Write a prompt on /input and submit it. */
async function writePrompt(page: Page, prompt: string) {
  await expect(page).toHaveURL(/\/input/, { timeout: 15_000 });
  await pause(page, 600);
  await page.getByRole('textbox').first().click();
  await typeSlowly(page, prompt);
  await pause(page, 400);
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
}

/** On /draw: draw a smiley and submit it. */
async function drawAndSubmit(page: Page) {
  await expect(page).toHaveURL(/\/draw/, { timeout: 20_000 });
  await pause(page, 1200);
  await page.getByRole('button', { name: 'Start Drawing' }).click();
  await drawSmiley(page);
  await pause(page, 600);
  await page.getByRole('button', { name: 'Submit Drawing' }).click();
}

test.beforeEach(async ({ page }) => {
  await enableHandTrackingTestSeam(page);
});

test('gestures', async ({ page }) => {
  await page.goto('/solo');
  await pause(page, 1500);

  await record(page, 'gestures', async () => {
    await pause(page, 600);
    // Hover first so the cursor shows before the pen goes down.
    for (let i = 0; i < 8; i += 1) {
      await sendHandFrame(page, handPresentLandmarks(0.3 + i * 0.02, 0.35), 'HAND_PRESENT');
      await page.waitForTimeout(40);
    }
    await drawSmiley(page);
    await pause(page, 700);

    await page
      .getByRole('button', { name: /eraser/i })
      .first()
      .click();
    await pause(page, 400);
    await stroke(
      page,
      Array.from({ length: 30 }, (_, i): Point => [0.38 + i * 0.008, 0.5 + 0.03 * Math.sin(i / 2)]),
    );
    await pause(page, 1500);
  });
});

test('classic', async ({ page }) => {
  await enterName(page, 'Alex');
  await page.getByRole('button', { name: /Classic Play with friends/ }).click();
  await page.getByRole('button', { name: 'Host Game', exact: true }).click();
  await expect(page).toHaveURL('/host');

  await record(page, 'classic', async () => {
    await pause(page, 800);
    await page.getByRole('button', { name: /Add bot/ }).click();
    await pause(page, 500);
    await page.getByRole('button', { name: /Add bot/ }).click();
    await expect(page.getByText('PLAYERS 3/8')).toBeVisible();
    await pause(page, 700);
    await page.getByRole('button', { name: 'Start Game', exact: true }).click();

    await writePrompt(page, 'a penguin on a skateboard');
    await drawAndSubmit(page);

    await expect(page).toHaveURL(/\/guess/, { timeout: 30_000 });
    await pause(page, 3500); // let the bot's drawing animate in
    await page.getByRole('textbox').first().click();
    await typeSlowly(page, 'a bird');
    await page.getByRole('button', { name: 'Submit Guess' }).click();

    await expect(page).toHaveURL(/\/game/, { timeout: 30_000 });
    await pause(page, 3000);
    await page.mouse.wheel(0, 500);
    await pause(page, 2000);
  });
});

test('leaderboard', async ({ page }) => {
  await enterName(page, 'Sam');
  await page.getByRole('button', { name: /AI Mode/ }).click();
  await page.getByRole('button', { name: 'Leaderboard vs Bot', exact: true }).click();
  await expect(page.getByText('PLAYERS 2/8')).toBeVisible({ timeout: 10_000 });

  await record(page, 'leaderboard', async () => {
    await pause(page, 600);
    await page.getByRole('button', { name: 'Start Game', exact: true }).click();
    await writePrompt(page, 'a cat wearing a crown');
    await drawAndSubmit(page);

    await expect(page).toHaveURL(/\/rating/, { timeout: 30_000 });
    await pause(page, 3000);
    await page.getByLabel('Score').click();
    await typeSlowly(page, '85');
    await pause(page, 300);
    await page.getByRole('button', { name: 'Submit Rating' }).click();

    await expect(page).toHaveURL(/\/rating-reveal/, { timeout: 30_000 });
    await pause(page, 2500);
    await page.getByRole('button', { name: 'Continue to Leaderboard' }).click();
    await expect(page).toHaveURL(/\/leaderboard/, { timeout: 10_000 });
    await pause(page, 2500);
  });
});

test('ai-mode', async ({ page }) => {
  await record(page, 'ai-mode', async () => {
    await enterName(page, 'Jordan');
    await pause(page, 300);
    await page.getByRole('button', { name: /AI Mode/ }).click();
    await pause(page, 1200);
    await page.getByRole('button', { name: 'Classic vs Bots', exact: true }).click();
    await expect(page.getByText('PLAYERS 3/8')).toBeVisible({ timeout: 10_000 });
    await pause(page, 1200);
    await page.getByRole('button', { name: /Add bot/ }).click();
    await expect(page.getByText('PLAYERS 4/8')).toBeVisible();
    await pause(page, 1200);
    await page.getByRole('button', { name: 'Start Game', exact: true }).click();
    await expect(page).toHaveURL(/\/input/, { timeout: 15_000 });
    await pause(page, 1500);
  });
});

test('solo', async ({ page }) => {
  await page.goto('/solo');
  await pause(page, 1500);

  await record(page, 'solo', async () => {
    await pause(page, 800);
    await drawSmiley(page);
    await pause(page, 600);
    await page.getByRole('button', { name: 'Save + New Prompt' }).click();
    await pause(page, 1200);
    await page.mouse.wheel(0, 600);
    await pause(page, 2000);
  });
});

test('playground', async ({ page }) => {
  await page.goto('/playground');
  await pause(page, 1500);
  await page.getByLabel('Prompt for the bot to draw').scrollIntoViewIfNeeded();

  await record(page, 'playground', async () => {
    await pause(page, 500);
    await page.getByLabel('Prompt for the bot to draw').click();
    await typeSlowly(page, 'a rocket');
    await page.getByRole('button', { name: 'Draw it' }).click();
    await expect(page.getByRole('img', { name: /bot's drawing of a rocket/ })).toBeVisible();
    await page.getByRole('img', { name: /bot's drawing of a rocket/ }).scrollIntoViewIfNeeded();
    await pause(page, 4000);
  });
});
