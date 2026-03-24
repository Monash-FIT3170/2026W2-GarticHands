# Phase 9 — State Management with Zustand

**Goal:** Move shared data out of component state and into a global store.

---

## What to Do

- Install Zustand — `npm install zustand`
- Create a store for submissions data
- Both `SubmitWidget` and `RecentSubmissions` read from and write to the same store
- Remove any prop drilling that existed before
- Notice how the components no longer need to know about each other

---

## Why This Matters

Once multiple components need the same data, prop drilling becomes painful fast.
Zustand teaches the core concept — a shared reactive store — without Redux's boilerplate.
You'll appreciate it more having felt the pain of doing it without it first.

---

## Commit Message

```
feat: add Zustand store for submissions state
```

---

## PR Rules

Phases 5-12: Tag a teammate as reviewer. They must approve before merge.
