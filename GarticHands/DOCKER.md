# How to run Gartic Hands in Docker

Containerized setup for the whole stack: the React/Vite client (served by nginx)
and the Express + Socket.IO server, wired together so the browser talks to a
single origin (no CORS). Follows the standards in
[`../INSTRUCTION_MANUAL.md`](../INSTRUCTION_MANUAL.md).

## Outcome

`docker compose up` builds and runs the full game at **http://localhost:8080** —
the client is served by nginx, which reverse-proxies API and Socket.IO traffic
to the server container.

## Prerequisites

| Requirement      | Check                                   | Notes |
| ---------------- | --------------------------------------- | ----- |
| Docker Engine    | `docker --version` (>= 24)              | Docker Desktop on Windows/macOS |
| Docker Compose   | `docker compose version` (v2)           | Bundled with Docker Desktop |
| Free ports       | `8080` (web) and `3000` (server)        | Change via `.env` if taken |
| Webcam           | browser permission for hand-tracking    | Works on `localhost` over http |

Run all commands from the `GarticHands/` directory.

## TL;DR

```bash
cd GarticHands
cp .env.example .env          # optional — defaults work without it
docker compose up -d --build  # build + start in the background
# open http://localhost:8080 in two browser windows
docker compose down           # stop when done
```

## Step-by-step

1. **Enter the app directory.**
   - Command: `cd GarticHands`
   - Expected: you are in the folder containing `docker-compose.yml`.
   - If it fails: you cloned a different layout — find `docker-compose.yml` with `git ls-files | grep docker-compose`.

2. **(Optional) Create your env file.**
   - Command: `cp .env.example .env`
   - Expected: a `.env` you can edit to change `WEB_PORT`, `SERVER_PORT`, or `VITE_API_URL`.
   - If it fails: skip it — the compose file has built-in defaults (8080 / 3000 / same-origin).

3. **Build and start.**
   - Command: `docker compose up -d --build`
   - Expected output (last lines):
     ```
     Container gartichands-server-1  Healthy
     Container gartichands-client-1  Started
     ```
   - If it fails: see [Troubleshooting](#troubleshooting).

4. **Confirm both services are healthy.**
   - Command: `docker compose ps`
   - Expected: both rows show `Up ... (healthy)`.
   - If it fails: `docker compose logs server` / `docker compose logs client`.

5. **Open the game.**
   - Open **http://localhost:8080** in two browser windows (host in one, join in the other).
   - Expected: the landing page; create a room in one window, join with the code in the other.
   - If it fails: see [Troubleshooting](#troubleshooting).

### PowerShell equivalents (Windows without `make`)

```powershell
cd GarticHands
Copy-Item .env.example .env          # optional
docker compose up -d --build
docker compose ps
docker compose down
```

### Using the Makefile (if `make` is installed)

```bash
make up      # build + start
make ps      # status
make logs    # follow logs
make test    # validate config + smoke-test the server
make shell   # shell into the server container
make down    # stop
make clean   # stop + remove local images
```

## Verification

One command. Exits `0` only if the SPA is served **and** the API works through
the proxy (room creation round-trips):

```bash
curl -fsS http://localhost:8080/ | grep -q '<title>Gartic Hands' \
  && curl -fsS -X POST http://localhost:8080/rooms/create \
       -H 'Content-Type: application/json' -d '{"hostName":"verify"}' \
     | grep -q '"success":true' \
  && echo "VERIFIED" || echo "FAILED"
```

PowerShell:

```powershell
$spa = (Invoke-WebRequest http://localhost:8080/).Content -match '<title>Gartic Hands'
$api = (Invoke-RestMethod -Method Post http://localhost:8080/rooms/create -ContentType 'application/json' -Body '{"hostName":"verify"}').success
if ($spa -and $api) { 'VERIFIED' } else { 'FAILED' }
```

## Troubleshooting

| Symptom | Cause | Fix |
| ------- | ----- | --- |
| `error during connect ... dockerDesktopLinuxEngine` | Docker Desktop not running | Start Docker Desktop, wait until the whale icon is steady, retry |
| `Bind for 0.0.0.0:8080 failed: port is already allocated` | Port in use | Set `WEB_PORT` (and/or `SERVER_PORT`) in `.env`, then `docker compose up -d` |
| `Cannot find module '../x/Foo'` during build | Import case ≠ filename case (Linux is case-sensitive) | Rename the file or fix the import so case matches exactly |
| Web page loads but room actions fail | Built client points at the wrong origin | Ensure `VITE_API_URL` is **empty** for Docker, then rebuild: `docker compose build client` |
| `502 Bad Gateway` from nginx | Server unhealthy / not reachable | `docker compose logs server`; confirm it logs `listening on ... :3000` |
| Webcam blocked | Non-secure origin | Use `http://localhost:8080` (localhost is a secure context); a remote host needs HTTPS |

## Uninstall / rollback

```bash
docker compose down                       # stop + remove containers and network
docker compose down --rmi local           # also remove the built images
docker image rm gartichands-client:local gartichands-server:local 2>/dev/null || true
```

This leaves the repo exactly as before running the guide. No named volumes are
created (rooms are in-memory), so nothing else persists.

## Forkability notes

- **Swap the LLM/runtime:** none required here — this stack has no AI calls. When
  AI is added, route calls through a `chat()` adapter per
  [`FORKING.md`](FORKING.md), never a hard-coded provider.
- **Change ports/origin:** everything is driven by `.env` (`WEB_PORT`,
  `SERVER_PORT`, `VITE_API_URL`). No source edits needed.
- **Deploy remotely:** put the nginx (client) service behind TLS — the webcam
  hand-tracking requires a secure context off `localhost`.
- **Persist rooms:** the server is in-memory by design. To survive restarts,
  back rooms with Redis/Postgres and add a named volume (see `docker-compose.yml`
  comment) — that is the one place this setup is intentionally ephemeral.
- **Pin harder:** images use precise version tags. For reproducible-forever
  builds, pin by digest (`FROM node:22.14.0-alpine@sha256:...`); resolve digests
  with `docker buildx imagetools inspect <image:tag>`.
