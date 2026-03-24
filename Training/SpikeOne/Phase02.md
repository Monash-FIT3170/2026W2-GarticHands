# Phase 2 — Refactor Toward Reusability

**Goal:** Identify what's repeated across widgets and extract it.

---

## What to Do

- Wrap each widget in a shared `Card` component with consistent padding, border, and shadow
- Move shared styles into `components.css` — keep widget-specific styles local
- No new features — this is purely structural

---

## Why This Matters

Refactoring without changing behaviour is a core engineering skill.
You'll do this constantly on real teams. Notice how the app looks identical after, but the code is cleaner.

---

## Commit Message

```
refactor: extract Card component and consolidate shared styles
```

---

## PR Rules

Phases 1-4: Open PR, merge yourself. Focus on commit discipline.
