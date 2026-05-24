# `legacy/`

Pre-merge source preserved for reference. **Do not edit, install into, or import from this folder.**

## What's here

| Folder                  | What it was                                                            | Replaced by                          |
| ----------------------- | ---------------------------------------------------------------------- | ------------------------------------ |
| `Frontend/`             | The game UI: lobby, routing, pages, top-right buttons, landing styling | [`../client/`](../client/)           |
| `GarticHandsBackend/`   | Simple Express REST server (rooms create/join/ready/start)             | [`../server/`](../server/)           |
| `drawing-input/client/` | MediaPipe hand-tracking + canvas spike with its own React app          | [`../client/src/drawing/`](../client/src/drawing/) (modules only — the spike's pages were dropped) |
| `drawing-input/server/` | Socket.IO + Express server for hand/drawing broadcast                  | Merged into [`../server/index.js`](../server/index.js) |

## Why keep it

1. **Reference**: a few behaviors (room polling logic, gesture detection thresholds, wasm path tricks) are easier to consult here than to dig out of git history.
2. **Safety net**: if a merge mistake bites, the original code is one folder away.
3. **Documentation source**: `drawing-input/REVIEW.md` and `drawing-input/Instructions.md` capture known-bug notes that haven't been ported yet.

## Rules

- **Read-only**. Anything you change here will get overwritten without warning.
- **No installs**. `node_modules/` may exist from before the merge; don't re-create them.
- **No imports**. The new `client/` and `server/` must not import from `legacy/`. If you need behavior from here, copy the relevant code into the new tree and adapt it.
- **Safe to delete eventually**. Once the merge is stable and known-bug notes have been ported, the team can remove this folder entirely.

## Notable files worth reading once

- [`drawing-input/REVIEW.md`](drawing-input/REVIEW.md) — known bugs and the fixes already applied during the WASM migration.
- [`drawing-input/Instructions.md`](drawing-input/Instructions.md) — original setup walkthrough.
- [`Frontend/src/Pages/`](Frontend/src/Pages/) — original lobby pages (joined / hosting). Already copied to `client/src/Pages/`.

## Plan to delete this folder

Suggested checklist before removing `legacy/`:

- [ ] All REVIEW.md known bugs are either fixed in `client/` or tracked as GitHub issues.
- [ ] No file in `client/` or `server/` references a path under `legacy/`.
- [ ] No PR in flight touches `legacy/`.
- [ ] Team agrees in standup.

When ready: `git rm -r GarticHands/legacy`.
