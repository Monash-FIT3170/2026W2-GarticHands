# Gartic Hands

Gartic Hands is a browser-based multiplayer drawing-and-guessing game inspired by Gartic Phone. Players draw using hand gestures detected through a webcam, while other players guess the drawings. The game supports multiple modes, AI-generated prompts, AI drawing-and-guessing bots, and competitive drawing ratings.

**Unit:** FIT3170 Software Engineering Practice, Monash University, 2026

**Repository:** https://github.com/Monash-FIT3170/2026W2-GarticHands

**Live application:**
- Client: https://gartic-hands-client.onrender.com
- Server: https://two026w2gartichands.onrender.com

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Running with Docker](#running-with-docker)
- [Game Modes](#game-modes)
- [Drawing Controls](#drawing-controls)
- [Architecture](#architecture)
- [Repository Structure](#repository-structure)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Deployment](#deployment)
- [Development Workflow](#development-workflow)
- [AI Features](#ai-features)
- [Known Issues](#known-issues)
- [Recommended Next Steps](#recommended-next-steps)
- [Contributing](#contributing)
- [AI Acknowledgements](#ai-acknowledgements)

## Features

### Multiplayer gameplay

- Create and join multiplayer rooms using room codes.
- Support for up to 8 players per room.
- Configurable drawing time and number of rounds.
- Player readiness controls and host-managed game settings.
- Automatic phase transitions based on submissions and timers.
- Player presence monitoring and removal of inactive players.
- AI bots that can participate in game rooms.

### Drawing and hand tracking

- Webcam-based hand tracking using MediaPipe.
- Pinch gestures to draw and an open palm to erase.
- Eight preset colours and a custom colour option.
- Four drawing thicknesses and four eraser sizes.
- Clear canvas and Pen Up controls.
- One-Euro filter smoothing and curved drawing strokes.
- Split, overlay and combined drawing layouts.
- Colour-vision accessibility modes.

### AI-powered features

- AI-generated prompt suggestions.
- AI bots that write prompts, draw, guess and rate drawings.
- AI Classic and AI Showdown game modes.
- Solo mode with endless AI-generated words.
- Playground mode with an option to watch an AI bot draw.
- Built-in prompt banks, drawing templates and canned guesses as fallbacks.
- Support for Groq and other OpenAI-compatible providers, with Gemini used for AI Mode guesses.

### User experience

- Dedicated How to Play page with GIF demonstrations.
- Lobby-based game mode selection and room settings.
- Drawing reveal slideshow and local video recordings.
- Showdown ratings and leaderboard.
- Exit controls during supported game phases.
- Rules panel and colour-vision settings.

## Technology Stack

| Layer | Technologies |
|---|---|
| Client | TypeScript, React 19, Vite 8, React Router 7, Tailwind CSS 3 |
| Hand tracking | `@mediapipe/tasks-vision`, `1eurofilter` |
| Server | Node.js 22, Express 5, Socket.IO 4 |
| AI | OpenAI-compatible HTTP client, Google Generative AI SDK |
| Testing | Vitest, Testing Library, Node.js test runner, Playwright, k6 |
| Code quality | ESLint 9, Prettier 3, Husky, commitlint |
| Development | npm workspaces, GitHub Actions |
| Deployment | Render, Docker Compose, nginx |

The project is organised as an npm-workspace monorepo with a shared lockfile.

## Getting Started

### Prerequisites

Install the following:

- Node.js 22.x. Docker uses Node.js 22.14.0, while CI uses Node.js 24.
- npm 11.x.
- Chrome or Edge and a webcam for drawing features.
- Git.

Optional tools:

- Docker Desktop with Docker Compose v2.
- k6 for load testing.
- A Groq API key for AI features.
- A Gemini API key for AI Classic guesses.

Check your installed versions:

```bash
node --version
npm --version
docker compose version
k6 version
```

Windows is supported, but CI runs on Ubuntu. Ensure import paths match filename casing.

### 1. Clone the repository

```bash
git clone https://github.com/Monash-FIT3170/2026W2-GarticHands.git
cd 2026W2-GarticHands/GarticHands
```

The npm workspace root is the `GarticHands/` directory.

### 2. Install dependencies

```bash
npm install
```

This installs dependencies for both workspaces and sets up the Husky hooks.

Run installation from the workspace root. Do not run `npm install` separately inside `client/` or `server/`.

### 3. Start the development servers

```bash
npm run dev
```

The development servers run at:

- Client: http://localhost:5173
- Server: http://localhost:3000

Open the client in two or three browser windows to test multiplayer gameplay. Classic mode requires at least three players, while Showdown requires at least two. A human player can also play with AI bots.

For faster testing, shorten the phase durations:

```bash
PROMPT_SECONDS=10 DRAW_SECONDS=20 GUESS_SECONDS=10 RATING_SECONDS=10 npm run dev
```

To remove bot delays during development:

```bash
BOT_DELAY_SCALE=0 npm run dev
```

These environment variables affect the server process started by the development command.

### 4. Verify the application

Run the following commands from `GarticHands/`:

```bash
npm run lint
npm run format:check
npm run build
```

Run the client tests:

```bash
cd client
npx vitest run
cd ..
```

Run the server tests:

```bash
npm test -w @gartichands/server
```

Run the end-to-end tests:

```bash
npm run test:e2e
```

See [Testing](#testing) for details about test coverage and limitations.

## Environment Configuration

### Local environment variables

The server loads environment variables from `GarticHands/server/.env` when running locally.

Create the file:

```bash
cd server
touch .env
```

Add the required configuration as needed. Do not commit API keys or other secrets.

The root `.env.example` contains configuration examples, but it does not include every supported variable. In particular, `GEMINI_API_KEY` and the `LLM_*` overrides need to be configured separately.

### Environment variable reference

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000` | Client API base URL |
| `PORT` | `3000` | Server port |
| `PROMPT_SECONDS` | `60` | Prompt phase duration |
| `DRAW_SECONDS` | `60` | Default drawing phase duration |
| `GUESS_SECONDS` | `60` | Guess phase duration |
| `RATING_SECONDS` | `60` | Rating phase duration |
| `PLAYER_TIMEOUT_SECONDS` | `30` | Player inactivity timeout |
| `BOT_DELAY_SCALE` | `1` | AI bot timing multiplier; `0` makes bots act instantly |
| `AI_ENABLED` | Enabled by default | Disables the shared AI seam when set to `false` |
| `LLM_PROVIDER` | `groq` | AI provider: Groq, Ollama or a custom OpenAI-compatible provider |
| `GROQ_API_KEY` | None | Groq API key |
| `LLM_BASE_URL` | None | Base URL for a custom AI provider |
| `LLM_API_KEY` | None | API key for a custom AI provider; may be optional |
| `LLM_MODEL_FAST` | `openai/gpt-oss-20b` for Groq | Fast model |
| `LLM_MODEL_SMART` | `openai/gpt-oss-120b` for Groq | Higher-capability model |
| `LLM_MODEL_VISION` | None | Vision model override |
| `LLM_TIMEOUT_MS` | `8000` | Shared AI request timeout |
| `GEMINI_API_KEY` | None | Gemini API key for AI Classic guesses |
| `WEB_PORT` | `8080` | Docker Compose web port |
| `SERVER_PORT` | `3000` | Docker Compose server port |
| `BASE_URL` | `http://localhost:3000` | Base URL used by k6 |

Room settings can override the drawing duration. The default phase durations are also configurable through environment variables.

For a custom provider, the relevant model variables must be supplied.

**Important configuration notes:**

- The root `.env.example` sets `VITE_API_URL` to the production server. Leave it empty for Docker Compose. Local development normally uses the default localhost URL.
- Client variables beginning with `VITE_` are included in the public client bundle. Never place API keys in them.
- AI keys belong in `GarticHands/server/.env` locally and in the server service's environment configuration in production.
- `AI_ENABLED=false` disables the shared AI provider seam but does not disable the separate Gemini guesser.
- Environment changes in production require a redeployment.

## Running with Docker

Docker Compose runs the client and server together.

From the `GarticHands/` directory:

```bash
cp .env.example .env
docker compose up -d --build
```

Open http://localhost:8080.

To stop the containers:

```bash
docker compose down
```

### Docker configuration notes

The Compose configuration forwards `GROQ_API_KEY`, `LLM_PROVIDER` and `AI_ENABLED`, but does not currently forward `GEMINI_API_KEY`.

To enable AI Classic guesses in Docker, add the following under the server service's environment configuration in `docker-compose.yml`:

```yaml
GEMINI_API_KEY: "${GEMINI_API_KEY:-}"
```

Check the Docker configuration before relying on AI Mode.

The `sharp` native dependency introduced by PR #131 should also be tested on both Render and the Alpine Docker image before merging changes that depend on it.

## Game Modes

Gartic Hands supports six game modes or gameplay experiences.

### Classic

Classic is a multiplayer drawing-and-guessing mode requiring at least three players.

The round follows these phases:

1. Players submit written prompts.
2. Players draw another player's assigned prompt under a timer.
3. Players guess the drawings.
4. The game reveals the prompt, drawing and guess through a slideshow.

The reveal also supports local video recordings.

### Showdown

Showdown is the competitive rating mode, requiring at least two players.

The round follows these phases:

1. Players submit written prompts.
2. Players draw another player's assigned prompt.
3. Each player rates one assigned drawing from 0 to 100.
4. The host advances through the rating reveal.
5. Players view the leaderboard.

The server represents this mode internally as `leaderboard`.

### AI Classic

AI Classic uses AI-assigned prompts and includes AI guesses for drawings. Human players wait for the AI guess during the guessing phase.

The mode uses Gemini for AI guesses, while the shared AI provider seam supports other AI features.

### AI Showdown

AI Showdown combines AI-assigned prompts and bot participation with the Showdown rating and leaderboard flow.

### Solo

Solo provides an endless sequence of AI-generated words. It uses local fallback prompts when AI generation is unavailable.

### Playground

Playground provides a sandbox for drawing and experimenting. Players can also watch an AI bot draw using the `POST /ai/draw` endpoint.

Solo and Playground do not require a multiplayer room.

## Drawing Controls

Drawing uses webcam-based hand tracking through MediaPipe.

| Gesture or control | Function |
|---|---|
| Pinch thumb and index finger | Draw |
| Open palm | Erase |
| Visible hand without a pinch | Move the cursor |
| Pencil | Draw using the selected colour and thickness |
| Eraser | Erase using the selected eraser size |
| Clear | Clear the canvas |
| Pen Up | Pause drawing without leaving the drawing frame |
| Colour selector | Choose from eight preset colours or a custom colour |
| Thickness selector | Choose thickness 2, 4, 8 or 12 |
| Eraser size selector | Choose size 8, 12, 18 or 24 |

Pinch detection uses three-dimensional thumb-to-index distance relative to palm width. Drawing starts below a threshold of 0.35 times palm width and ends above 0.5 times palm width for four frames.

The One-Euro filter smooths drawing movements, while midpoint quadratic curves improve stroke rendering.

Drawing layouts support split, overlay and combined views. The selected layout is saved in:

```text
localStorage['gartichands:drawMode']
```

Colour-vision settings include default, deuteranopia, protanopia and tritanopia modes.

Gesture-sensitivity settings from an earlier pull request are not present on `main`; they remain on `ChinsDevBranch`.

## Architecture

### Overview

The client is built with React and TypeScript, while the server uses Node.js and Express.

The server owns game state, room data and phase timers. The client retrieves room state through REST polling and submits player actions through REST endpoints.

Socket.IO is installed on the server but is currently unused by the client.

### Client

The client is responsible for:

- Rendering the landing page, lobby and gameplay pages.
- Managing navigation between game phases.
- Capturing hand gestures through MediaPipe.
- Rendering drawing strokes and toolbar controls.
- Submitting prompts, drawings, guesses and ratings.
- Displaying AI suggestions and local fallback content.
- Showing reveal slideshows, ratings and leaderboards.

The client polls the room endpoint approximately once per second to retrieve the latest room state and server time.

Drawings are submitted as PNG data URLs. The hand-tracking model loads from Google's CDN.

### Server

The Express server is responsible for:

- Creating, joining and managing rooms.
- Enforcing player limits and rejecting duplicate player names.
- Managing host permissions and room settings.
- Tracking player presence and removing inactive players.
- Managing game phases, timers and automatic transitions.
- Assigning prompts, drawings and rating targets.
- Scheduling AI bots.
- Generating AI prompts and drawings.
- Processing guesses and calculating scores.
- Providing REST API endpoints.

Room state is stored in memory. It is not persisted to a database.

### Game phases and timing

Both multiplayer modes begin with the prompt phase.

Classic continues through drawing, guessing and reveal. Showdown continues through drawing, rating, rating reveal and leaderboard.

The server's `setPhase` function handles phase transitions by clearing the previous timer, setting the phase deadline and scheduling bots.

A phase advances when all active players submit or when the deadline expires. Missing submissions are backfilled using default submissions.

The server uses the following configuration:

| Setting | Value |
|---|---|
| Default maximum rounds | 4 |
| Maximum players per room | 8 |
| AI bots per room | 5 |
| Drawing-time options | 30–360 seconds |
| Round options | 1–8 |
| Default phase durations | 60 seconds |
| Phase grace period | 1,500 ms |
| Player inactivity timeout | 30 seconds |
| Presence sweep interval | 3 seconds |
| Empty-room cleanup | 60 seconds |

Classic requires three players to start, while Showdown requires two. The server does not currently enforce host, readiness or already-started checks on the start endpoint.

### AI architecture

The shared AI provider seam is located in:

```text
server/ai/chat.js
server/ai/providers/openaiCompatible.js
```

The shared seam supports Groq, Ollama and other OpenAI-compatible endpoints.

AI Classic guesses use a separate Gemini implementation:

```text
server/ai/guesser.js
```

Other AI modules include:

```text
server/ai/promptGenerator.js
server/ai/drawer.js
server/ai/drawingTemplates.js
server/ai/bots.js
server/data/promptBank.js
```

The AI drawing implementation returns validated drawing shapes on a 100 × 75 grid and renders them as animated SVG. The model does not generate drawing pixels directly.

When AI services are unavailable, the game falls back to built-in prompt banks, drawing templates and canned guesses.

### State and persistence limitations

Room state exists only in the server process's memory. A server restart, redeployment or sleep can terminate active games.

The client does not currently implement reconnection after a refresh. A refresh during a game drops the player from the current experience.

Socket.IO handlers exist but are not used by the client.

## Repository Structure

The git root is `2026W2-GarticHands/`. The application and most project documentation live in `GarticHands/`.

```text
2026W2-GarticHands/
├── .claude/
│   └── agents/
│       └── code-reviewer.md
├── .github/
│   ├── copilot-instructions.md
│   └── workflows/
├── .husky/
├── .vscode/
├── load-testing/
├── README.md
├── package.json
├── package-lock.json
└── GarticHands/
    ├── ARCHITECTURE.md
    ├── AGENTS.md
    ├── CONTRIBUTING.md
    ├── DOCKER.md
    ├── FORKING.md
    ├── PROMPT_INJECTION_HANDBOOK.md
    ├── README.md
    ├── .env.example
    ├── docker-compose.yml
    ├── Makefile
    ├── package.json
    ├── package-lock.json
    ├── scripts/
    │   └── validate-branch.js
    ├── client/
    │   ├── src/
    │   │   ├── Pages/
    │   │   ├── api/
    │   │   ├── components/
    │   │   ├── hooks/
    │   │   ├── drawing/
    │   │   └── ...
    │   ├── public/
    │   │   ├── mediapipewasm/
    │   │   └── howto/
    │   └── unit-tests/
    ├── server/
    │   ├── index.js
    │   ├── ai/
    │   ├── data/
    │   └── __tests__/
    ├── component-tests/
    ├── e2e-tests/
    │   └── howto/
    └── legacy/
```

The `legacy/` directory contains archived training materials, Gantt charts and other historical project material. Do not edit it.

Other repository rules:

- Maintain one `package-lock.json` per package root.
- Do not commit `node_modules`.
- Changes to `.husky/`, GitHub workflows, branch validation or lint configuration should be made through a tooling pull request.
- `GarticHands/test-results/` contains accidentally committed test output and should be cleaned up.

## API Reference

The following endpoints are defined in `server/index.js`.

### Health and AI endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Health check |
| POST | `/ai/prompts` | Generate a batch of prompts |
| POST | `/ai/draw` | Generate an animated SVG drawing |

`POST /ai/prompts` accepts a theme, difficulty, count and excluded prompts. It is limited to 20 requests per minute per IP before falling back to built-in prompts.

`POST /ai/draw` accepts a prompt of up to 120 characters and is limited to one request every two seconds per IP.

### Room management endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/rooms/create` | Create a room |
| POST | `/rooms/join` | Join an existing room |
| GET | `/rooms/:code` | Retrieve room state and update player presence |
| DELETE | `/rooms/:code/players/:name` | Remove a player from a room |
| PATCH | `/rooms/:code/ready` | Update player readiness |
| PATCH | `/rooms/:code/settings` | Update room settings |
| PATCH | `/rooms/:code/start` | Start a game |
| PATCH | `/rooms/:code/restart` | Restart the next round |
| PATCH | `/rooms/:code/end` | Return to the lobby |
| POST | `/rooms/:code/bots` | Add an AI bot |

Room creation accepts the mode, maximum rounds and AI mode flag. Room settings can be changed by the host while the room is in the lobby.

The server enforces the eight-player limit and returns HTTP 409 for duplicate player names.

### Gameplay endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/rooms/:code/prompts` | Submit prompts |
| POST | `/rooms/:code/drawings` | Submit drawings |
| POST | `/rooms/:code/guesses` | Submit guesses |
| POST | `/rooms/:code/ratings` | Submit Showdown ratings |
| PATCH | `/rooms/:code/rating-reveal` | Advance the Showdown rating reveal |

Showdown ratings must be integers from 0 to 100.

The start endpoint requires at least three players for Classic and two for Showdown.

Socket.IO handlers are present in the server, but the client does not currently use them.

## Testing

The project has client unit tests, component tests, server tests, end-to-end tests and load-testing scenarios.

| Test layer | Location | Runner | Approximate coverage |
|---|---|---|---|
| Client unit tests | `client/unit-tests/` | Vitest | 18 files, approximately 117 tests |
| Component tests | `component-tests/` | Vitest and Testing Library | 28 files, approximately 225 tests |
| Server tests | `server/__tests__/` | Node.js test runner | 6 suites, approximately 80 tests |
| End-to-end tests | `e2e-tests/` | Playwright | 14 specifications, approximately 24 tests |
| Load tests | `load-testing/` | k6 | 4 scenarios, 3 in CI |

### Run the tests

Run client unit and component tests:

```bash
cd client
npx vitest run
cd ..
```

Run server tests:

```bash
npm test -w @gartichands/server
```

Run end-to-end tests:

```bash
npm run test:e2e
```

Run load testing with the server already running:

```bash
k6 run load-testing/scenarios/five-player-game.js
```

Run the lint and formatting checks:

```bash
npm run lint
npm run format:check
```

Automatically fix lint and formatting issues where supported:

```bash
npm run lint:fix
npm run format
```

Build the client:

```bash
npm run build
```

### Test limitations

- Server tests are not included in CI.
- The server test suites stub network calls for AI modules. Bot-game and bot-pacing tests start a real server with `AI_ENABLED=false`.
- The server calls `listen()` unconditionally and does not export the Express app, so in-process route testing requires extracting the app.
- No tests currently cover the AI Mode guesser.
- The `us15-recordings-replay` and `us21-visual-regression` Playwright tests are skipped through `testIgnore`.
- The Prettier CI step uses `--write` and cannot fail the workflow when formatting is incorrect.
- The Vite coverage configuration has an incorrect path and omits new pages and components.
- CI runs end-to-end and load tests on pushes to `main`. The server suite is not part of any workflow.

### How to re-record How to Play GIFs

The project includes GIF demonstrations for the How to Play page.

Run the recorder:

```bash
npx playwright test --config=e2e-tests/howto/playwright.howto.config.ts
```

The GIFs can then be regenerated using the recorder and `make_gifs.py` in `e2e-tests/howto/`.

Re-record the demonstrations manually after relevant UI changes.

## Deployment

The client and server are deployed on Render and automatically redeploy when changes are pushed to `main`.

- Client: https://gartic-hands-client.onrender.com
- Server: https://two026w2gartichands.onrender.com

Dashboard access was held by Bexley D'Rozario and Ashutosh Shrivastav as of Milestone 3.

The recorded build configuration is:

- Client build: `npm pkg delete scripts.prepare && npm install --ignore-scripts && npm run build`
- Server install: `npm install --ignore-scripts`
- Server start: `node index.js`

Check the Render dashboard for the current configuration.

### Production considerations

The documented Render free tier has 512 MB RAM and 0.1 CPU and sleeps when idle. Waking the service can take approximately one minute.

Because room state and AI rate limits are held in memory, a restart or sleep ends active games and resets in-memory rate limits.

Production AI keys must be configured in the server service's environment settings. Changes require a redeployment.

The `render.yaml` configuration is absent, so environment and service settings should be checked directly in the Render dashboard.

## Development Workflow

### Branch model

The project uses sub-team integration branches:

- `dev/ui-1`
- `dev/ui-2`
- `dev/ai`

Feature branches are merged into the appropriate integration branch before changes are promoted to `main`.

The branch validator accepts `dev/<name>`. Plain `dev` is no longer used.

### Pull request process

1. Create a branch from the relevant `dev/*` branch, or from `main` for a hotfix.
2. Keep each branch focused on one concern.
3. Run the relevant tests, lint and formatting checks.
4. Open a pull request against the relevant integration branch.
5. Request code review and resolve review comments.
6. Merge the integration branch into `main` when the changes are ready.
7. Ensure the required CI checks pass before merging.

Pull requests into `dev/*` do not currently receive CI checks, so running the verification commands locally is particularly important.

### Main branch rules

The `main` branch has a ruleset requiring:

- Two pull request approvals.
- Dismissal of stale approvals.
- Resolution of review threads.
- A successful required `lint` check.
- No branch deletion or force-pushing.

The ruleset targets `refs/heads/main`. The separate Assignment ruleset does not target any branches, and classic branch protection is not used.

### Commit conventions

Use Conventional Commits with a required scope.

Supported types include:

- `feat`
- `fix`
- `docs`
- `refactor`
- `test`
- `chore`

Examples:

```text
feat(room): add configurable drawing duration
fix(ai): handle generated drawing formats
docs(readme): update development instructions
test(server): add room settings coverage
```

The project uses TypeScript strict mode and Prettier with a line width of 100 characters. UI primitives are located under `components/ui/`.

AI-assisted commits should include a `Co-Authored-By:` trailer.

### AI-assisted development tools

The repository includes:

- `.claude/agents/code-reviewer.md`
- `.github/copilot-instructions.md`
- `GarticHands/AGENTS.md`
- `GarticHands/PROMPT_INJECTION_HANDBOOK.md`

Some agent instructions predate Milestone 4 and do not include Showdown, bots or AI Mode. Review and update them before relying on them for current development.

## AI Features

### Shared AI provider

The shared AI seam is implemented in `server/ai/chat.js` and `server/ai/providers/openaiCompatible.js`.

It supports Groq by default, as well as Ollama and custom OpenAI-compatible endpoints.

The shared AI seam is used for prompt generation and suggestions, Solo prompts, bot drawings and guesses, and Playground drawing generation.

### Prompt generation

`server/ai/promptGenerator.js` generates a batch of prompts and validates and deduplicates the results.

When generation fails, prompts are taken from `server/data/promptBank.js`, which contains easy, medium and hard prompts.

AI Mode retrieves prompts for the room in a single call, allowing prompts to be assigned individually rather than giving everyone the same prompt.

### AI drawing

`server/ai/drawer.js` generates a maximum of 24 shapes on a 100 × 75 grid.

The server validates the shapes and renders them as animated SVG. If the AI provider is unavailable, the game uses `server/ai/drawingTemplates.js`.

### AI bots

`server/ai/bots.js` manages bot behaviour, while scheduling is handled in `server/index.js`.

Bots can write prompts, draw, guess and rate drawings. Each room supports up to five AI bots.

Bots count as active players but cannot become the room host. Their fallback behaviour includes 18 canned prompts and random ratings between 55 and 95.

### AI provider differences

| Feature | Shared AI seam | AI Mode guesser |
|---|---|---|
| Implementation | `server/ai/chat.js` | `server/ai/guesser.js` |
| Provider | Groq by default; Ollama and custom OpenAI-compatible endpoints | Gemini |
| API key | `GROQ_API_KEY` or custom provider configuration | `GEMINI_API_KEY` |
| Main use | Prompts, suggestions, bot behaviour and drawings | AI guesses in AI Classic |
| Timeout | 8 seconds by default; 15 seconds for drawings | No equivalent shared-seam safeguards |
| Failure behaviour | Falls back to built-in content | May display "something mysterious" |

AI functionality is optional. The game can still run without API keys using its built-in prompts, drawing templates and canned guesses.

### AI safety and reliability

The shared AI seam includes an AI-enabled flag, timeout handling and prompt-injection safeguards.

AI prompts are validated before being used. Generated drawing shapes are validated by the server before rendering.

The Gemini guesser does not currently use the shared seam, meaning it does not receive all the same safeguards and failure-handling behaviour.

The recommended refactor is to route `guesser.js` through the shared AI seam using `chat(messages, 'vision')`, with suitable support for image formats.

## Known Issues

The following issues were identified in the Milestone 4 handover at commit `77d75a6`.

### Gameplay and server issues

- Room-code collisions can overwrite an existing room because room-code generation does not check uniqueness.
- The start endpoint does not enforce host permissions, readiness or an already-started check.
- Host checks are missing from some restart, end and rating-reveal endpoints.
- There is no reconnect support after a browser refresh.
- Timers can continue advancing in empty rooms.
- Room and game endpoints lack comprehensive request validation and rate limits.
- Player names and prompts do not have comprehensive length limits.
- The server cannot currently be imported for in-process route testing because it calls `listen()` unconditionally.
- Socket.IO CORS configuration is restricted to localhost, and socket relays can fall back to global broadcasts. These are latent issues because the client does not use sockets.
- The leaderboard appears to represent running totals, but scores are rebuilt from the current room ratings and reset on restart. It therefore behaves as a per-round leaderboard.

### AI issues

- AI Classic can fail when guessing AI-generated bot drawings. The bot produces SVG, while the Gemini guesser labels the drawing as PNG. Gemini rejects the mismatched format, resulting in the fallback guess "something mysterious".
- Small valid drawings can be rejected as a blank canvas when their base64 data is under 1,000 characters.
- `GEMINI_API_KEY` is missing from `.env.example` and Docker Compose.
- The Gemini model name is hard-coded in `server/ai/guesser.js` and needs to be moved to `LLM_MODEL_VISION` before the documented model shutdown on 7 May 2027.
- There is no explicit handling for Gemini HTTP 429 responses.
- The prompt shown to players may differ from the prompt assigned to their drawing. The input page displays the room's `aiPrompt`, while the server assigns individual prompts. This should be verified in a two-player AI Classic game.
- The AI quick-start path is not functioning as expected because `hostingPage.tsx` reads `location.state.bots`, which no current code path passes.

### Testing and development issues

- Server tests are not included in CI.
- Two end-to-end tests covering recording replay and visual regression are skipped.
- The Prettier CI step cannot fail when formatting is incorrect because it uses `--write`.
- CI does not run for pull requests into integration branches.
- The Vite coverage configuration has an incorrect path and omits newer pages and components.
- Test output was accidentally committed under `GarticHands/test-results/`.
- Approximately 30 remote branches remained as of the handover, mostly merged.
- The load-testing README is empty, and the late-join load scenario is disabled.
- The `vercel.json` file is vestigial.
- The How to Play documentation GIFs need to be regenerated manually after UI changes.
- `@mediapipe/tasks-vision` is a development dependency, while the hand-tracking model and font load from Google at runtime.

### Pull requests requiring attention

| PR | Status | Recommended action |
|---|---|---|
| #131 | AI drawing-decoding fix, open against `main` | Rebase onto `77d75a6`, review the changes, and test `sharp` on Render and Docker |
| #123 | Toolbar overflow fix | Likely redundant because the same branch was already merged into `dev/ui-1` as #126 |
| #63 | Lobby UI improvements | Superseded by later changes; close |

## Recommended Next Steps

The following actions are prioritised by value in the Milestone 4 handover.

1. **Fix AI Classic guessing.** Rebase and review PR #131, resolve the SVG/image-format problem, handle small valid drawings, route the guesser through the shared AI seam and move the vision model name into configuration.

2. **Transfer AI key ownership.** Move API keys to accounts controlled by the next team, rotate the keys and complete the AI tooling companion's key-holder table.

3. **Improve CI coverage.** Add server tests to CI, change Prettier CI to a non-writing check, add CI for pull requests into `dev/*`, remove committed test output and resolve the skipped end-to-end tests.

4. **Update developer documentation.** Update `AGENTS.md`, the Copilot review rubric and `FORKING.md` to reflect Milestone 4. Add a root `CLAUDE.md` pointing to the relevant instructions.

5. **Harden server behaviour.** Add host and readiness checks to game-start endpoints, host checks for restart, end and rating reveal, unique room-code generation, and an Express app export for in-process testing.

6. **Improve persistence and connectivity.** Implement client sockets, Redis persistence and reconnect support.

## Contributing

Before contributing, review the repository's `CONTRIBUTING.md`, `ARCHITECTURE.md`, `AGENTS.md` and `FORKING.md`.

Keep changes focused, follow the branch model and commit conventions, and run the relevant checks before opening a pull request.

Avoid editing legacy material unless the change explicitly requires it. Tooling changes to Git hooks, workflows, branch validation and lint configuration should be handled through a tooling pull request.

## AI Acknowledgements

AI assistance was used in preparing the Milestone 4 handover document for the project. This included generating the document from a read-only survey of `main`, conducting an independent review and formatting the summary.

The handover was generated on 20 October 2026 and condensed on 21 October 2026.

Additional information about AI models, providers, API keys, open-weight options and AI development tooling is documented in `GarticHands-AI-Tooling-M4.md`.
