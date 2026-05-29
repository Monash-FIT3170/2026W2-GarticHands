# 2026W2-GarticHands

Multiplayer drawing-and-guessing game built for FIT3170. Players draw prompts using **webcam hand-tracking** (MediaPipe) — no mouse, no stylus — and other players guess what was drawn.

> **All code, docs, and assets live under [`GarticHands/`](GarticHands/).** Start there.

## Quickstart

```bash
cd GarticHands
npm install
npm run dev
```

Open http://localhost:5173 in two browser windows.

### Or run it all in Docker

```bash
cd GarticHands
docker compose up -d --build
```

Open http://localhost:8080. See [`GarticHands/DOCKER.md`](GarticHands/DOCKER.md) for the full guide.

## Documentation

- **[`GarticHands/README.md`](GarticHands/README.md)** — project overview, packages, MVP status, full merge log.
- **[`GarticHands/ARCHITECTURE.md`](GarticHands/ARCHITECTURE.md)** — how the pieces fit together, with sequence diagrams.
- **[`GarticHands/AGENTS.md`](GarticHands/AGENTS.md)** — quick context for coding agents (Claude / Cursor / Copilot / MCP tools).
- **[`GarticHands/DOCKER.md`](GarticHands/DOCKER.md)** — run the whole stack in containers (`docker compose up`).
- **[`GarticHands/FORKING.md`](GarticHands/FORKING.md)** — forkability seams + suggested prompts for future developers.
- **[`INSTRUCTION_MANUAL.md`](INSTRUCTION_MANUAL.md)** — the working method (containerization, MCP, forkability, how-to standards).
- **[`GarticHands/CONTRIBUTING.md`](GarticHands/CONTRIBUTING.md)** — dev workflow, branching, commit conventions.
- **[`GarticHands/client/README.md`](GarticHands/client/README.md)** — front-end (React 19 + Vite 8 + TS).
- **[`GarticHands/server/README.md`](GarticHands/server/README.md)** — back-end REST + Socket.IO API reference.
- **[`GarticHands/legacy/README.md`](GarticHands/legacy/README.md)** — what's in the pre-merge `legacy/` folder and why it's preserved.

## Team

| Name                  | Email                                | GitHub             |
| --------------------- | ------------------------------------ | ------------------ |
| Forrest Huang         | fhua0018@student.monash.edu          | forrestdesu12      |
| Jayavi Meemaduma      | jmee0005@student.monash.edu          | jayavi999          |
| Mitchell Rocks        | mroc0003@student.monash.edu          | mitchrock04        |
| Bexley D'Rozario      | bdro0002@student.monash.edu          | bexley07           |
| Ashutosh Shrivastav   | ashr0018@student.monash.edu          | hshdhshshjjjjj     |
| Chinmay Purohit       | cpur0011@student.monash.edu          | ChinmayGit8765     |
| Hoang Minh Do         | hdoo0027@student.monash.edu          | Shuriky            |
| Nikunj Gupta          | ngup0018@student.monash.edu          | nik6052            |
| Skand Advaith Maddula | smad0038@student.monash.edu          | skandadvaith09     |
