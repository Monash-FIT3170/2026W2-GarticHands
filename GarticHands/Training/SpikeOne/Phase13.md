# Phase 13 — Data Visualisation

**Goal:** Fetch structured data from a pre-built endpoint and render a chart.

---

## What to Do

- A `GET /api/stats` endpoint is already built for you — it returns submissions grouped by day
- Search npmjs.com and pick your own charting library — Recharts, Chart.js, Victory, Nivo, and others all exist
- Read the library docs and render a meaningful chart from the data
- The API shape will **not** match what your library expects — you'll need to transform it
- **Justify your library choice in the PR description**

### Endpoint Shape

The endpoint returns:

```json
{
  "submissions_per_day": [
    { "date": "2025-03-01", "count": 4 },
    ...
  ]
}
```

Your charting library will likely want something different. That's the exercise.

---

## Why This Matters

Data transformation — reshaping an API response into a chart-friendly format — is a daily frontend task.
Evaluating charting libraries teaches you to read tradeoffs: bundle size, API design, customisation.
The `/api/stats` endpoint is pre-built so the focus stays on the frontend data layer.

---

## Commit Message

```
feat: add submissions chart using [chosen library]
```

Replace `[chosen library]` with the actual library name you picked.

---

## PR Rules

Phase 13: Your SA is the reviewer. They approve and merge the final PR.
