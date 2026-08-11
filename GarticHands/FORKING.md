# Forkability Schematics & Suggested Prompts

A map of the **seams** in Gartic Hands — the deliberate points where a future
developer can swap, extend, or replace a part without rewriting the rest — plus
ready-to-paste prompts for common changes. Read alongside
[`../INSTRUCTION_MANUAL.md`](../INSTRUCTION_MANUAL.md) (the process standards) and
[`DOCKER.md`](DOCKER.md) (how to run it).

> **What "forkable" means here:** every external dependency (origin, transport,
> storage, input method, and any future LLM) sits behind a single, named seam.
> You change the seam, not the callers.

---

## 1. System schematic

```
                        Browser (one origin: http://localhost:8080)
                                     │
                  ┌──────────────────┴───────────────────┐
                  │            client (nginx)             │   ← container: client/Dockerfile
                  │  serves built SPA  +  reverse proxy   │     config: client/nginx.conf
                  └───────┬───────────────────────┬───────┘
            static SPA    │                       │  /rooms   /socket.io
                          │                       ▼
                          │            ┌───────────────────────┐
                          │            │   server (Node)       │   ← container: server/Dockerfile
                          │            │  Express + Socket.IO  │     code: server/index.js
                          │            │  in-memory `rooms`    │
                          │            └───────────────────────┘
                          ▼
              SPA code (React + Vite + TS)
              ├─ src/api/room.ts        ← API/transport seam (VITE_API_URL)
              ├─ src/hooks/usePhaseAdvance.ts ← polling-vs-sockets seam
              ├─ src/drawing/**         ← input seam (MediaPipe hand-tracking)
              └─ src/Pages/**           ← one file per route
```

Orchestration: [`docker-compose.yml`](docker-compose.yml) · config: [`.env.example`](.env.example)

---

## 2. The seams (where to change things)

| # | Seam | Lives in | Swap it to… | Touch nothing else because… |
|---|------|----------|-------------|------------------------------|
| 1 | **Origin / ports** | `.env`, `docker-compose.yml` | different ports, remote host, HTTPS | callers use relative URLs + env vars |
| 2 | **API client** | [`client/src/api/room.ts`](client/src/api/room.ts) | a different base URL, auth headers, error handling | every page imports these functions, not `fetch` |
| 3 | **Transport** | `room.ts` + [`client/src/hooks/usePhaseAdvance.ts`](client/src/hooks/usePhaseAdvance.ts) | Socket.IO realtime (server already emits `room-update`) instead of 1 s REST polling | pages react to room state, not to *how* it arrives |
| 4 | **State / persistence** | the `rooms` object in [`server/index.js`](server/index.js) | Redis / Postgres + a named volume | all room reads/writes funnel through a few helpers (`submitForPhase`, route handlers) |
| 5 | **Game rules** | `MAX_ROUNDS`, phase order, `submitForPhase`, cyclic assignment in `server/index.js` | more rounds, scoring, new phases | the phase machine is one function + a phase string |
| 6 | **Input method** | [`client/src/drawing/`](client/src/drawing/) (MediaPipe + canvas) | mouse/stylus/touch input | `Pages/drawPage.tsx` consumes a `<Canvas>` + tracker interface |
| 7 | **Container runtime** | `server/Dockerfile`, `client/Dockerfile`, `client/nginx.conf` | different base images, extra services, CDN | services talk over the compose network by name |
| 8 | **LLM (prescribed)** | *not present yet* → add `server/ai/` with `providers/` | any provider via `LLM_PROVIDER` | calls go through `chat(messages, model_profile)`, never a vendor SDK directly |

### Seam 8 in detail — the LLM adapter (for when AI is added)

Gartic Hands has **no AI today**. When someone adds it (AI guesser, prompt
generator, drawing scorer), it must land behind a forkable adapter so the fork
isn't locked to one vendor:

```
server/
  ai/
    chat.js              # chat(messages, model_profile) — selects provider by env LLM_PROVIDER
    providers/
      anthropic.js       # <= 80 lines each, one responsibility: call + normalize
      openai.js
      google.js
      ollama.js          # local / offline fork path
```

Every AI prompt added to the code carries a **forkability_contract** header:
required capabilities (vision? JSON mode? tool calling?), token budget, output
schema, and graceful-degrade behavior if a capability is missing. Prefer
exposing external tools/data as **MCP servers** under `mcp/` (see the manual)
rather than bespoke wrappers.

---

## 3. Suggested prompts for future updates

Paste any of these into your AI coding agent. Each is self-contained and bakes
in the project standards (containerize → verify → document, no vendor lock-in).
Start every session by loading Appendix A of
[`../INSTRUCTION_MANUAL.md`](../INSTRUCTION_MANUAL.md) as the system prompt.

### A. Switch realtime from REST polling to Socket.IO

```text
The server already emits `room-update` over Socket.IO but the client uses 1 s
REST polling via client/src/hooks/usePhaseAdvance.ts. Wire the client to
Socket.IO instead, keeping the same React-facing contract so Pages don't change.
Constraints:
- Add socket.io-client to the client workspace; connect through the same origin
  (path /socket.io, already proxied by client/nginx.conf) — do NOT hardcode a host.
- Keep room.ts as the single transport seam; expose a subscribeRoom(code, cb).
- Fall back to polling if the socket fails to connect (graceful degrade).
- Verify with two browser windows: a ready-toggle in one updates the other in
  <500 ms with no polling requests in the Network tab.
- Update DOCKER.md verification if the smoke test changes.
```

### B. Make rooms survive a server restart (persistence)

```text
Rooms are an in-memory object in server/index.js, so a restart 404s every room.
Add Redis-backed persistence behind the existing room helpers without changing
any route signatures or client code.
Constraints:
- Add a `redis` service to docker-compose.yml with a NAMED VOLUME and a healthcheck.
- Read REDIS_URL from env; default to the compose service. Document it in .env.example.
- Keep all room access funnelled through helper functions (no scattered redis calls).
- Verify: create a room, `docker compose restart server`, GET the room — still 200.
- Update DOCKER.md (new service, new env var, updated uninstall/volume notes).
```

### C. Add an AI feature behind a forkable adapter (+ MCP)

```text
Add an AI <prompt-generator | guesser | drawing-scorer>. It MUST be forkable.
Constraints:
- Create server/ai/chat.js exposing chat(messages, model_profile), selecting the
  provider via env LLM_PROVIDER (anthropic|openai|google|ollama). One adapter per
  provider under server/ai/providers/, each <= 80 lines. No vendor SDK called
  outside its adapter. No API keys in code — read from env, add to .env.example.
- Give the prompt a forkability_contract header (capabilities, token budget,
  output schema, graceful-degrade).
- If it needs external data/tools, expose them as an MCP server under mcp/<name>/
  (Dockerfile, schema.json, README how-to, tests) and register in mcp.config.json.
- Containerize: the AI path must work under `docker compose up`. Add a one-command
  verification and a how-to section. Don't break the no-key local fork (ollama).
```

### D. Add a new game phase

```text
Add a "<phase-name>" phase to the round flow (currently
lobby→prompt→draw→guess→reveal in server/index.js).
Constraints:
- Extend the phase machine via the existing submitForPhase() pattern + a new
  submit endpoint; keep the "advance when everyone submitted" rule.
- Add the matching client Page + route in src/GarticHands.tsx; reuse
  usePhaseAdvance so navigation stays automatic.
- No new transport assumptions; go through room.ts.
- Verify the full loop in two browser windows under `docker compose up`.
```

### E. Swap the drawing input method

```text
Replace/extend MediaPipe hand-tracking (client/src/drawing/) with <mouse|stylus|touch>
input, selectable at runtime.
Constraints:
- Keep Pages/drawPage.tsx consuming the same Canvas + tracker interface; put the
  new input behind that interface so no Page logic changes.
- Submitted output stays a PNG data URL (server validates data:image/).
- Verify a drawing submits and advances to /guess under `docker compose up`.
```

### F. Add CI that builds and verifies the containers

```text
Add a CI workflow that, on PRs, runs `docker compose build` then `docker compose up -d`
and executes the DOCKER.md verification command, failing the build on any error.
Constraints:
- Pin the runner image and actions by version.
- Cache the npm layer for speed but never the final images.
- Surface logs on failure. Keep it provider-agnostic (plain docker compose, no
  vendor-specific build service).
```

### G. Harden image pinning (digests)

```text
Pin every base image in server/Dockerfile and client/Dockerfile by digest
(FROM image:tag@sha256:...). Resolve digests with
`docker buildx imagetools inspect <image:tag>`. Re-run `docker compose build` and
the DOCKER.md verification to confirm nothing broke. Note the digests + how to
refresh them in DOCKER.md's forkability section.
```

---

## 4. Fork checklist

Before publishing a fork, confirm:

- [ ] `cp .env.example .env` then `docker compose up -d --build` works from a clean clone.
- [ ] The [`DOCKER.md`](DOCKER.md) verification command prints `VERIFIED`.
- [ ] No hard-coded origins, ports, model IDs, or API keys in source (`grep` them).
- [ ] Any new external dependency sits behind one of the seams above.
- [ ] Any AI added goes through `chat()` + `LLM_PROVIDER` with a forkability_contract.
- [ ] New work shipped with: container support, a verification command, and a how-to.
