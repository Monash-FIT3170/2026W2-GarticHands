# Phase 8 — POST Data to the Backend

**Goal:** Add two new widgets — one to submit data, one to display it.

---

## What to Do

- **SubmitWidget** — a form that POSTs a string to `POST /api/submissions`
- **RecentSubmissions** — exists but shows a "no data yet" placeholder — intentionally incomplete
- The POST endpoint receives data and logs it to console for now
- Name routes around resources, not actions — `/api/submissions` not `/api/postData`

---

## Why This Matters

In real sprints, you build the UI shell before the data layer is ready.
`RecentSubmissions` is waiting on the DB — that's next phase's job.
Incomplete-by-design is a real pattern.

---

## Commit Message

```
feat: add POST /api/submissions and submission form widget
```

---

## PR Rules

Phases 5-12: Tag a teammate as reviewer. They must approve before merge.
