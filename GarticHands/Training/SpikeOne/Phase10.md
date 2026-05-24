# Phase 10 — Add a Database

**Goal:** Persist submissions to MongoDB.

---

## What to Do

- Install mongoose — `npm install mongoose`
- Connect to a MongoDB instance (MongoDB Atlas free tier or a local Docker container)
- Define a `Submission` model with `content` and `createdAt` fields
- Wire `POST /api/submissions` to save a new document
- Wire `GET /api/submissions` to return all documents
- Understand what a document is and how it differs from a SQL row — no schema enforcement by default

```
server/
  index.js
  routes/
    message.js
    submissions.js
  models/
    Submission.js
```

---

## Why This Matters

MongoDB is document-based — data is stored as JSON-like objects rather than rows and columns.
This maps naturally to how JavaScript already thinks about data, which is why it's common in Node stacks.
Mongoose adds a schema layer on top so you get some structure without a rigid SQL migration cycle.

---

## Commit Message

```
feat: add MongoDB persistence for submissions via Mongoose
```

---

## PR Rules

Phases 5-12: Tag a teammate as reviewer. They must approve before merge.
