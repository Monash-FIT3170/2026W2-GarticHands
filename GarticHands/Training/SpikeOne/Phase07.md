# Phase 7 — Connect a Backend (GET)

**Goal:** Spin up an Express server and fetch data from it in the frontend.

---

## What to Do

- Create a `server/` directory alongside your `client/`
- Build one route: `GET /api/message` — returns a JSON sentence
- Each widget fetches from this endpoint and displays the sentence
- Handle the CORS error you **will** definitely hit — understand why it exists before you fix it

```
server/
  index.js
  routes/
    message.js
client/
  src/
    ...
```

---

## Why This Matters

The browser blocks cross-origin requests by default as a security model.
In real teams, misconfigured CORS is a surprisingly common source of bugs. Know what it is.

---

## Commit Message

```
feat: add Express server with GET /api/message endpoint
```

---

## PR Rules

Phases 5-12: Tag a teammate as reviewer. They must approve before merge.
