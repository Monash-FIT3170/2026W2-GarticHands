# Phase 5 — Add React Router

**Goal:** Convert the tab UI into real URL-driven routes.

---

## What to Do

- Install `react-router-dom`
- Replace the tab state with `<Route>` components — one per phase page
- Use `<Link>` for navigation, not `onClick` state toggles
- Each phase now lives at its own URL: `/phase-1`, `/phase-2`, etc.
- The browser back button should now work correctly

---

## Why This Matters

URL-driven navigation is how real apps work.
State-based tab switching breaks bookmarking, sharing links, and browser history.
Understanding the difference between client-side routing and server-side routing is foundational.

---

## Commit Message

```
feat: replace tab state with React Router routes
```

---

## PR Rules

Phases 5-12: Tag a teammate as reviewer. They must approve before merge.
