# 2026W2-GarticHands

Multiplayer drawing-and-guessing game built for FIT3170. Players draw prompts using **webcam hand-tracking** (MediaPipe) — no mouse, no stylus — and other players guess what was drawn.

> **All code, docs, and assets live under [`GarticHands/`](GarticHands/).** Start there.

> Last edits to this project were made on the **3/09/2026**

## Team - Individuals who built the code

| Name                  | Email                       | GitHub         |
| --------------------- | --------------------------- | -------------- |
| Forrest Huang         | fhua0018@student.monash.edu | forrestdesu12  |
| Jayavi Meemaduma      | jmee0005@student.monash.edu | jayavi999      |
| Bexley D'Rozario      | bdro0002@student.monash.edu | bexley07       |
| Ashutosh Shrivastav   | ashr0018@student.monash.edu | hshdhshshjjjjj |
| Chinmay Purohit       | cpur0011@student.monash.edu | ChinmayGit8765 |
| Hoang Minh Do         | hdoo0027@student.monash.edu | Shuriky        |
| Nikunj Gupta          | ngup0018@student.monash.edu | nik6052        |
| Skand Advaith Maddula | smad0038@student.monash.edu | skandadvaith09 |

## Quickstart - Run the game locally

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

## Normal start - Run the game online

### Host

1. Host user opens the Client URL for the environment - [`gartic-hands-client.onrender.com`]
2. They create a room - the back end will generate room code
3. Host shares room code

### Player

1. Open same link as host
2. Put the shared code in to join room - server will add them to the room
3. real time events broadcasted to room

## Requirments

### Software

You will need some form of IDE to be able to spin start up the program

### Hardware

As most of this application is hosted via the web, a simple computer is all that is required to run this software

The computer in question must have:

- A working camera
- A working browser

## Hosting

To host the game uses the platform Render

This allows the frontend and backend to communicate directly during hosted instances

Changes pushed to main will be auto deployed **Warning: When installing new packages, the deployment may need to be modified**

_**When first opening the link if no other instances are present, Render will need time to boot up**_

### Frontend

Hosts the React/Vite app

Build command: npm pkg delete scripts.prepare && npm install --ignore-scripts && npm run build

### Backend

Manages Express + Socket.io

Start command: node index.js

Build command: npm install --ignore-scripts

## For Extra Information see

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
