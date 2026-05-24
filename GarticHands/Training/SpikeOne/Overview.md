# Full Stack Spike

**React | Express | Tailwind | MongoDB | Testing | Charts**

A workforce-modelled learning exercise for software engineering students.
Each phase represents a logical unit of work — something you'd commit, describe, and hand off.
The goal is to understand **why** each piece exists, not just how to use it.

**Expected completion time: 8 - 12 hours**

---

## Recommended Tooling

We strongly recommend using **Cursor** (or VS Code) with **Claude Code** as your IDE setup:

- **Cursor** — an AI-native code editor built on VS Code. It gives you inline AI suggestions, chat-based editing, and all the VS Code extensions you already know. It's free for students and has excellent quality-of-life features for navigating unfamiliar codebases.
- **Claude Code** — Anthropic's CLI agent that runs in your terminal. It can read your project, run commands, edit files, and explain code in context. Extremely useful for debugging, understanding new libraries, and getting unstuck on configuration issues.

Together, these tools let you move faster through each phase while still understanding what's happening. Use Claude to **explain** things you don't understand — don't just copy-paste solutions blindly.

---

## Project Structure

The repo is split into two separate Node projects — a Vite React frontend and an Express backend.
Each has its own `package.json` and `node_modules`. You run them in two separate terminals.

```
fullstack-spike/
├── client/                         ← Vite + React + Tailwind (you scaffold this)
│   ├── src/
│   │   ├── App.jsx                 ← Tab shell with React Router
│   │   ├── pages/
│   │   │   ├── Phase1.jsx          ← Placeholder — team fills in
│   │   │   ├── Phase2.jsx
│   │   │   └── ... Phase12.jsx
│   │   └── components/
│   └── package.json
├── server/
│   ├── index.js
│   ├── routes/
│   │   ├── message.js
│   │   ├── submissions.js
│   │   └── stats.js
│   ├── models/
│   │   └── Submission.js
│   └── package.json
└── README.md
```

---

## Branch Strategy

The lead sets up the repo and creates one personal branch per team member off `main`. Nobody ever pushes directly to `main` or to their personal branch — all work lives in phase branches.

```
main                    ← scaffolded shell only, no one touches this
├── alice               ← created by lead, Alice's base
│   ├── alice/phase-1
│   ├── alice/phase-2
│   └── ...
├── bob
│   ├── bob/phase-1
│   └── ...
└── charlie
    └── ...
```

---

## Team Member Workflow

```bash
# 1. Clone and install
git clone <repo-url>
cd fullstack-spike

cd client && npm install
cd ../server && npm install

# 2. Check out your personal branch
git checkout alice

# 3. Create a phase branch off your personal branch
git checkout -b alice/phase-1

# 4. Do the work, then commit
git add .
git commit -m "feat: phase 1 counter widget with plain CSS"
git push origin alice/phase-1

# 5. Open a PR → target YOUR personal branch (not main)
```

---

## Running the App

You need two terminals running simultaneously — one for the frontend, one for the backend.

| Terminal  | Command                                      |
|-----------|----------------------------------------------|
| Frontend  | `cd client` → `npm run dev` → localhost:5173 |
| Backend   | `cd server` → `npm run dev` → localhost:3001 |

---

## PR Review Rules

| Phases | PR Rule                                                          |
|--------|------------------------------------------------------------------|
| 1 - 4  | Open PR, merge yourself. Focus on commit discipline.             |
| 5 - 12 | Tag a teammate as reviewer. They must approve before merge.      |
| 13     | Your SA is the reviewer. They approve and merge the final PR.    |

Peer review starts when backend code arrives — that's the code actually worth reviewing. Reviewing CSS changes in phase 1 teaches nothing. The SA does the final PR so you get senior-level feedback on the most complex work — your library choices, data transformation, and overall code quality.

---

## Rules

- Never push directly to `main`
- Never push directly to your personal branch
- Phase branches always come off your personal branch
- PR target is always your own personal branch, not `main`

---

## The Phases

| Phase | Title                        | File                                      |
|-------|------------------------------|-------------------------------------------|
| 1     | Get Something on the Screen  | [Phase01.md](Phase01.md)                  |
| 2     | Refactor Toward Reusability  | [Phase02.md](Phase02.md)                  |
| 3     | Strip the Styles             | [Phase03.md](Phase03.md)                  |
| 4     | Add Tailwind                 | [Phase04.md](Phase04.md)                  |
| 5     | Add React Router             | [Phase05.md](Phase05.md)                  |
| 6     | Source Your Own Loading UI   | [Phase06.md](Phase06.md)                  |
| 7     | Connect a Backend (GET)      | [Phase07.md](Phase07.md)                  |
| 8     | POST Data to the Backend     | [Phase08.md](Phase08.md)                  |
| 9     | State Management (Zustand)   | [Phase09.md](Phase09.md)                  |
| 10    | Add a Database               | [Phase10.md](Phase10.md)                  |
| 11    | Write Tests                  | [Phase11.md](Phase11.md)                  |
| 12    | Complete the Loop            | [Phase12.md](Phase12.md)                  |
| 13    | Data Visualisation           | [Phase13.md](Phase13.md)                  |

---

## How to Review a PR

A good PR review is not about finding mistakes. It's about making sure the code is understandable, consistent, and that patterns are being applied correctly.

### Start With the PR Description

Before looking at a single line of code, read the PR description. Ask yourself:

- Does it explain what was built and why?
- For library choices — does the author justify why they picked this one over alternatives?
- Are there any known limitations or follow-up tasks called out?

If the description is empty or just says "done", leave a comment asking the author to fill it in before you review. Writing the description is part of the work.

### Look for Patterns, Not Just Correctness

- Are components structured the same way as existing ones?
- Are route names following the resource-based convention (`/api/submissions` not `/api/getData`)?
- Are variable and function names consistent in style with the rest of the project?

> **Consistency is more important than personal preference.**
> If the codebase does it one way and this PR does it differently for no stated reason, flag it.
> If you would do it differently but both approaches are valid — say so, but don't block the merge.

### Comment Types

| Type       | What It Means                                                                     |
|------------|-----------------------------------------------------------------------------------|
| Blocking   | Must be resolved before merge. The code has a bug, breaks a pattern, or is incomplete. |
| Suggestion | Worth considering but not required. A cleaner approach or an alternative pattern.  |
| Question   | You don't understand something. Could be fine — just needs clarification.          |
| Praise     | Something done well. Leave these too.                                             |

---

## What You'll Have Built

| Skill                                 | Where You Practised It |
|---------------------------------------|------------------------|
| Component architecture & refactoring  | Phases 1 - 2          |
| CSS layering & utility-first design   | Phases 3 - 4          |
| URL-driven routing                    | Phase 5               |
| npm ecosystem evaluation              | Phases 6, 13          |
| REST API design & CORS                | Phase 7               |
| Full CRUD cycle                       | Phases 8, 10, 12      |
| Global state management               | Phase 9               |
| Database integration                  | Phase 10              |
| Unit & integration testing            | Phase 11              |
| Data transformation & visualisation   | Phase 13              |
| Git branch discipline                 | Every phase            |
| PR review & code reading              | Phases 7 - 13         |
| Commit message discipline             | Every phase            |

*The tech will change. The patterns won't.*
