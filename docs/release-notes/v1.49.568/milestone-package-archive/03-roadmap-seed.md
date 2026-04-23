# Roadmap Seed — Nonlinear Systems, Clouds, Open Frontier

When `/gsd-new-milestone nonlinear-systems-clouds-frontier` runs, this seed becomes the initial phase list in `.planning/ROADMAP.md`.

## Phases

### P1 — Concept Panels Activation
**Goal:** 19 concept files (already on disk) become first-class Rosetta-wired Rosetta-core citizens.
**Depends on:** concept seeder already complete (2026-04-22)
**Waves:** 1 (Sonnet-parallel per-concept)
**Deliverable:** D1

### P2 — Publication Cuts + FTP Sync
**Goal:** 4 live web pages on tibsfox.com generated from FINAL.md.
**Depends on:** FINAL.md (2026-04-22), publish-pipeline skill
**Waves:** 1 (Sonnet sequential — FTP must finish cleanly before next ship)
**Deliverable:** D2

### P3 — Forest-Sim Microphysics Extensions
**Goal:** Köhler activation + K41 sub-grid turbulence added to `forest/simulation.js` behind feature flags.
**Depends on:** P1 (concept panels become lookup surface for sim)
**Waves:** 2 (Köhler first, K41 second — sequential to avoid merge contention)
**Deliverable:** D3, D4

### P4 — Erdős Tracker Refresh + #143 Elevation
**Goal:** Weekly `erdos-refresh.py` + published #143 transfer-of-method write-up on tibsfox.com.
**Depends on:** ERDOS-TRACKER enrichment (done 2026-04-22), publish-pipeline
**Waves:** 1 (Sonnet sequential)
**Deliverable:** D5, D6

### P5 — Final Test Pass + Audit
**Goal:** +34 new tests pass; `npm test` count ≥ 21,948 + 34 = 21,982; no regressions.
**Depends on:** P1 + P2 + P3 + P4 complete
**Waves:** 1 (Sonnet)
**Deliverable:** D7

## Execution Ordering (topological)

```
P1  P2
 └─┐│
   ▼▼
   P3
   │
   ▼
   P4
   │
   ▼
   P5
```

P1 and P2 run in parallel. P3 waits on P1 (sim code references concept IDs). P4 waits on P3 (final publish batch). P5 is last.

## Suggested Milestone Numbering

- Current: **v1.49.561 Living Sensoria** (ready_for_review)
- Suggested next: **v1.49.562 Nonlinear Frontier** (after 561 merges to main)
- Or: **v1.50** candidate — The Space Between (birthday milestone, 2026-04-21) already has its UC chain; the Nonlinear Frontier can become v1.51 if v1.50 stays reserved

**Recommendation:** land this as v1.49.562 shortly after 561 merges. Size fits in ~2 sessions; that matches the user's single-release-at-a-time cadence (`feedback_release-pipeline-quality`).
