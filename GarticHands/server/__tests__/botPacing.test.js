/**
 * Bots pace themselves against the deadline of the phase they are in. Runs a
 * server with real bot delays and a one-second prompt phase, then checks that
 * bots don't submit drawings the instant the timed-out prompt phase ends.
 */
const { it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');

const PORT = 40000 + Math.floor(Math.random() * 10000);
const BASE = `http://localhost:${PORT}`;

let server;

async function api(method, url, body) {
  const res = await fetch(`${BASE}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body && JSON.stringify(body),
  });
  return res.json();
}

before(async () => {
  server = spawn(process.execPath, [path.join(__dirname, '..', 'index.js')], {
    env: { ...process.env, PORT: String(PORT), AI_ENABLED: 'false', PROMPT_SECONDS: '1' },
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

it('keeps a human-like delay after a phase times out', async () => {
  const { roomCode } = await api('POST', '/rooms/create', { hostName: 'Ivy' });
  await api('POST', `/rooms/${roomCode}/bots`, { playerName: 'Ivy' });
  await api('POST', `/rooms/${roomCode}/bots`, { playerName: 'Ivy' });
  await api('PATCH', `/rooms/${roomCode}/start`);

  // Ivy never writes a prompt, so the 1s prompt phase expires (plus 1.5s grace).
  let room;
  const until = Date.now() + 6000;
  do {
    await new Promise((r) => setTimeout(r, 100));
    ({ room } = await api('GET', `/rooms/${roomCode}?playerName=Ivy`));
  } while (room.phase !== 'draw' && Date.now() < until);
  assert.equal(room.phase, 'draw');

  // Bots wait at least 8s before drawing; a second in, nothing should be in.
  await new Promise((r) => setTimeout(r, 1000));
  ({ room } = await api('GET', `/rooms/${roomCode}?playerName=Ivy`));
  const botDrawings = room.players
    .filter((p) => p.isBot)
    .filter((p) => room.drawings[p.name] !== undefined);
  assert.equal(botDrawings.length, 0);
});
