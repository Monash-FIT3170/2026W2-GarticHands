# Phase 11 — Write Tests

**Goal:** Add unit and integration tests to your existing code.

---

## What to Do

- Install **Vitest** for the frontend — test a pure utility function (e.g. a data formatter)
- Install **Supertest** for the backend — test the `GET /api/submissions` route directly
- Write at least one test that passes and understand why it passes
- Write at least one test that fails intentionally — then fix the code to make it pass

---

## Why This Matters

Testing code you already understand is how you learn to write testable code.
Testing from day one confuses beginners — doing it after you know the system makes the purpose clear.
The difference between a unit test and an integration test is not obvious until you've written both.

---

## Commit Message

```
test: add Vitest unit tests and Supertest route tests
```

---

## PR Rules

Phases 5-12: Tag a teammate as reviewer. They must approve before merge.
