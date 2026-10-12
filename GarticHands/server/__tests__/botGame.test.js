/**
 * End-to-end games against bots. Starts the real server in a child process
 * with AI off and instant bots, then plays through whole rounds over HTTP.
 */
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');

const PORT = 40000 + Math.floor(Math.random() * 10000);
const BASE = `http://localhost:${PORT}`;
const PNG = 'data:image/png;base64,iVBORw0KGgo=';

let server;

async function api(method, url, body) {
  const res = await fetch(`${BASE}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body && JSON.stringify(body),
  });
  return { status: res.status, ...(await res.json()) };
}

/** Poll the room (as `name`, which keeps them present) until `check` passes. */
async function waitFor(code, name, check, timeoutMs = 5000) {
  const until = Date.now() + timeoutMs;
  for (;;) {
    const { room } = await api('GET', `/rooms/${code}?playerName=${encodeURIComponent(name)}`);
    if (check(room)) return room;
    if (Date.now() > until) throw new Error(`timed out waiting; room phase is ${room.phase}`);
    await new Promise((r) => setTimeout(r, 50));
  }
}

async function roomWithBots(host, mode, bots) {
  const { roomCode } = await api('POST', '/rooms/create', { hostName: host, mode });
  let room;
  for (let i = 0; i < bots; i += 1) {
    ({ room } = await api('POST', `/rooms/${roomCode}/bots`, { playerName: host }));
  }
  return { code: roomCode, room };
}

before(async () => {
  server = spawn(process.execPath, [path.join(__dirname, '..', 'index.js')], {
    env: {
      ...process.env,
      PORT: String(PORT),
      AI_ENABLED: 'false',
      BOT_DELAY_SCALE: '0',
      PLAYER_TIMEOUT_SECONDS: '2',
    },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  await new Promise((resolve, reject) => {
    server.on('error', reject);
    server.stdout.on('data', (chunk) => {
      if (String(chunk).includes('listening')) resolve();
    });
  });
});

after(() => {
  server.kill();
});

describe('bots in the lobby', () => {
  it('only the host can add bots, and they join ready', async () => {
    const { roomCode } = await api('POST', '/rooms/create', { hostName: 'Ann' });
    await api('POST', '/rooms/join', { roomCode, playerName: 'Ben' });

    const denied = await api('POST', `/rooms/${roomCode}/bots`, { playerName: 'Ben' });
    assert.equal(denied.status, 403);

    const { room } = await api('POST', `/rooms/${roomCode}/bots`, { playerName: 'Ann' });
    const bot = room.players.find((p) => p.isBot);
    assert.ok(bot);
    assert.equal(bot.ready, true);
    assert.equal(bot.isHost, false);
  });

  it('caps bots at five', async () => {
    const { code } = await roomWithBots('Cal', 'classic', 5);
    const sixth = await api('POST', `/rooms/${code}/bots`, { playerName: 'Cal' });
    assert.equal(sixth.status, 409);
  });

  it('is never swept for not polling, and never becomes host', async () => {
    const { code } = await roomWithBots('Dee', 'classic', 2);
    await api('POST', '/rooms/join', { roomCode: code, playerName: 'Eve' });

    // Dee and Eve keep polling past the 2s presence timeout; the bots never do.
    const until = Date.now() + 4000;
    while (Date.now() < until) {
      await api('GET', `/rooms/${code}?playerName=Dee`);
      await api('GET', `/rooms/${code}?playerName=Eve`);
      await new Promise((r) => setTimeout(r, 250));
    }
    const { room: after } = await api('GET', `/rooms/${code}?playerName=Eve`);
    assert.equal(after.players.filter((p) => p.isBot).length, 2);

    await api('DELETE', `/rooms/${code}/players/Dee`);
    const { room: promoted } = await api('GET', `/rooms/${code}?playerName=Eve`);
    assert.equal(promoted.players.find((p) => p.isHost).name, 'Eve');
  });

  it('drops the bots once the last human leaves', async () => {
    const { code } = await roomWithBots('Fay', 'classic', 2);
    const { room } = await api('DELETE', `/rooms/${code}/players/Fay`);
    assert.equal(room.players.length, 0);
  });
});

describe('a Classic game with one human and two bots', () => {
  it('plays a full round: bots write, draw and guess', async () => {
    const { code } = await roomWithBots('Gus', 'classic', 2);

    const started = await api('PATCH', `/rooms/${code}/start`);
    assert.equal(started.success, true, 'three players satisfies the Classic minimum');

    await api('POST', `/rooms/${code}/prompts`, {
      playerName: 'Gus',
      prompt: 'a snowman wearing a hat',
    });

    const drawing = await waitFor(code, 'Gus', (r) => r.phase === 'draw');
    const bots = drawing.players.filter((p) => p.isBot).map((p) => p.name);
    for (const bot of bots) assert.ok(drawing.prompts[bot], `${bot} wrote a prompt`);

    // Nobody draws their own prompt, and nobody guesses the drawing of their
    // own prompt (that would be guessing an answer you already know).
    for (const player of drawing.players) {
      const author = drawing.promptTargets[player.name];
      assert.notEqual(author, player.name);
      const guessed = drawing.guessTargets[player.name];
      assert.ok(guessed, `${player.name} has a drawing to guess`);
      assert.notEqual(guessed, player.name);
      assert.notEqual(drawing.promptTargets[guessed], player.name);
    }
    const guessedDrawings = Object.values(drawing.guessTargets);
    assert.equal(new Set(guessedDrawings).size, guessedDrawings.length, 'one guesser per drawing');

    await api('POST', `/rooms/${code}/drawings`, { playerName: 'Gus', dataUrl: PNG });
    const guessing = await waitFor(code, 'Gus', (r) => r.phase === 'guess');
    for (const bot of bots) {
      assert.match(guessing.drawings[bot], /^data:image\/svg\+xml;base64,/);
    }

    // Some bot drew Gus's prompt.
    const drewMine = bots.find((b) => guessing.promptTargets[b] === 'Gus');
    assert.ok(drewMine);

    await api('POST', `/rooms/${code}/guesses`, { playerName: 'Gus', guess: 'a rocket' });
    const reveal = await waitFor(code, 'Gus', (r) => r.phase === 'reveal');
    for (const bot of bots) assert.equal(typeof reveal.guesses[bot], 'string');
    assert.ok(reveal.guesses[bots[0]].length > 0);
  });
});

describe('a Leaderboard game with one human and one bot', () => {
  it('the bot draws and rates, and scores are tallied', async () => {
    const { code } = await roomWithBots('Hal', 'leaderboard', 1);
    assert.equal((await api('PATCH', `/rooms/${code}/start`)).success, true);

    await api('POST', `/rooms/${code}/prompts`, { playerName: 'Hal', prompt: 'a fish' });
    await waitFor(code, 'Hal', (r) => r.phase === 'draw');
    await api('POST', `/rooms/${code}/drawings`, { playerName: 'Hal', dataUrl: PNG });
    await waitFor(code, 'Hal', (r) => r.phase === 'rating');

    await api('POST', `/rooms/${code}/ratings`, { playerName: 'Hal', rating: 80 });
    const reveal = await waitFor(code, 'Hal', (r) => r.phase === 'ratingReveal');

    const bot = reveal.players.find((p) => p.isBot).name;
    assert.equal(reveal.scores[bot], 80);
    assert.ok(reveal.scores.Hal >= 55 && reveal.scores.Hal <= 95);
  });
});

describe('POST /ai/draw', () => {
  it('draws any prompt as an SVG', async () => {
    const res = await api('POST', '/ai/draw', { prompt: 'a cat wearing a crown' });
    assert.equal(res.success, true);
    assert.equal(res.source, 'template');
    assert.match(res.dataUrl, /^data:image\/svg\+xml;base64,/);
  });

  it('rejects empty prompts', async () => {
    const res = await api('POST', '/ai/draw', { prompt: '  ' });
    assert.equal(res.status, 400);
  });
});
