# Phase 12 — Complete the Loop

**Goal:** Wire RecentSubmissions to display real data from the database.

---

## What to Do

- Fetch from `GET /api/submissions` on component load
- Display each submission as a list item inside the widget
- Add a refresh or auto-poll so new submissions appear without a page reload
- Update your Zustand store with the fetched data so other components stay in sync

---

## Why This Matters

You now have a complete request cycle — user input → POST → DB write → GET → UI render.
Every production web app is some version of this loop.

---

## Commit Message

```
feat: wire RecentSubmissions widget to GET /api/submissions
```

---

## PR Rules

Phases 5-12: Tag a teammate as reviewer. They must approve before merge.
