# GarticHands — Copilot instructions

Multiplayer drawing game: players draw with webcam hand-tracking (MediaPipe), others guess.
Stack: TypeScript + React 19 + Vite + Tailwind (client), Node 22 + Express 5 + Socket.IO (server, single file `GarticHands/server/index.js`, all state in-memory). npm workspaces rooted at `GarticHands/`. Read `GarticHands/AGENTS.md` for full conventions.

## Code review structure

Review every PR against these dimensions, in order, and label each finding with a severity:

- **critical** — breaks the build, tests, CI, or the game loop; violates a repo hard rule.
- **major** — the stated behavior is not actually delivered, or a likely CI/deploy failure.
- **minor** — style, docs, polish. Do not block on minors.

### 1. Repo hard rules (critical if violated)

- No edits under `GarticHands/legacy/` (read-only reference).
- Exactly one `package-lock.json` per package root — flag any lockfile churn or new dependency without justification.
- Branch names must match `(feature|bugfix|docs|refactor|test|chore)/kebab-case`.
- Commit messages: conventional with a **required scope** — `feat(room): …`, types `feat|fix|docs|refactor|test|chore`.
- No changes to `.husky/`, `.github/workflows/`, `GarticHands/scripts/validate-branch.js`, or lint/prettier/commitlint configs unless the PR is explicitly about tooling.

### 2. TypeScript & style (major/minor)

- `strict: true`; no `any` without a justifying comment; `import type` for type-only imports (`verbatimModuleSyntax`).
- Functional React components only; Tailwind classes inline; follow the existing file's patterns rather than inventing new ones.

### 3. Game-flow invariants (critical/major — the server is single-file and easy to regress)

- `setPhase()` is the **single** phase-transition entry point: it stamps `phaseEndsAt` and arms/clears the deadline timer. Any new advance path must route through it.
- "Everyone submitted" checks and deadline backfill must count **active** players only: present in `room.players` and not `joinedMidRound`.
- Removing a player must clean up their prompt/drawing/guess and `guessTargets` entry, promote a host if needed, and re-run `advanceIfPhaseComplete()`.
- Empty-room GC must clear the room's phase timer.
- No new client polling loops — the 1s `getRoom` poll doubles as the presence heartbeat (`?playerName=` must be passed).

### 4. Verification (major if missing)

- PRs into `dev` get **no CI** (CI runs only on PRs to `main`), so the PR description must show local gate results: `npm run lint`, `npm run format:check`, unit (`npx vitest run`), component (`npm run test:component`), and `npm run build`.
- Behavior changes need matching test updates in `GarticHands/client/unit-tests/` or `GarticHands/component-tests/` — deleted or hollowed-out tests are a critical finding.
- Merges to `main` auto-deploy to Render (static client + persistent Node server); flag anything that assumes serverless/multi-instance semantics — room state lives in one process's memory by design.

### 5. Accessibility & theming (major/minor)

- Colour-vision variants are driven by `data-color-vision` on `<html>` + CSS variables in `client/src/index.css`. New hard-coded accent hexes in components should be flagged: they bypass the colour-blind remapping.
- Default (no attribute) rendering must stay pixel-identical — visual-regression baselines exist for landing/host/join.

When you cannot verify a claim from the diff alone, say so explicitly rather than assuming it holds.
