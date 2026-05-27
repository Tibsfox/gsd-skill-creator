> Following v1.49.801 — _T1.1 Ship 7: `/sc:status` Bounded-Learning Integration (T1.1 ARC CLOSED)_, v1.49.802 ships as a codification milestone — promoting the three lesson candidates that accumulated during the T1.1 chained-session arc to ESTABLISHED status with backing canonical docs.

# v1.49.802 — Codification Ship: Promote #10425 + #10426 + #10427

**Shipped:** 2026-05-27

A discipline-coverage milestone that drains the lesson-candidate backlog from the T1.1 arc. Two new operative disciplines anchored, one existing discipline extended, three candidates promoted to ESTABLISHED.

## What shipped

- **`docs/bounded-learning-calibration-discipline.md`** — NEW operative discipline anchored by Lesson #10425. Documents the two-sided likelihood-ratio insensitivity trap on bounded binary observations and the math-check-before-test-fixture convention.
- **`docs/architecture-retrofit-patterns.md`** — Extended with Lesson #10426 ("Cross-class registry extraction at the SECOND class instance"). Joins #10414 (optional `ctx?` chokepoint) and #10416 (tolerant generators) under the same retrofit-patterns umbrella.
- **`docs/failure-mode-contracts.md`** — NEW operative discipline anchored by Lesson #10427. Documents the load-bearing-vs-accessory test, the contract documentation convention, and three reference implementations from the v799-801 chain.
- **`tools/render-claude-md/disciplines.json`** — Manifest grows from 15 to 17 entries; total lessons from 65 to 68.
- **`CLAUDE.md`** — Regenerated via `npm run render:claude-md`. Operators see the new disciplines surfaced at session start.

No `src/` changes. No tests added or modified.

## Through-line

The v784 and v790 codification ships established the pattern: when 5-8 candidate lessons accumulate across a 3-5 ship cluster, promote them in a single codification ship. v802 closes a different shape — the T1.1 chained-session arc produced three candidates in seven ships, with two of the three having unusually strong intra-arc validation (#10426 thrice consumer-side, #10427 thrice instance-side). The codification narrative is coherent with the arc retrospective: same chain produces the lessons AND the codification.

## Engine state

NASA degree sustains at **1.178**. Counter-cadence count UNCHANGED at 5.

## Discipline-coverage status

| Surface | Before | After |
|---|---|---|
| Manifest entries (operative disciplines) | 15 | 17 |
| Manifest lessons (ESTABLISHED IDs) | 65 | 68 |
| Open lesson candidate backlog | 3 | 0 |
| Tentative observations carried forward | 2 | 2 (unchanged) |

## Forward path

- **v1.49.803 — Real token-budget observation source.** Wires `token_budget.warn_at_percent` to event telemetry. Operator-chosen as the next ship in this chained session.
- **T1.3 — College of Knowledge consumer engine** (3-5 ships).
- **NASA 1.179 forward-cadence** — INTERSTELLAR-BOUNDARY axis obs#3.

---
**Prev:** [v1.49.801](../v1.49.801/00-summary.md)
