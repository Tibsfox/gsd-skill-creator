# v1.49.785 — PROJECT.md Normalizer + GAP Table Refresh

**Released:** 2026-05-26
**Type:** forward-cadence audit-driven counter-cadence chip (NOT a NASA degree advance; first ship of Tier 1 from `.planning/AUDIT-2026-05-26-core-functions-retrospective.md`)
**Predecessor:** v1.49.784 — Codification: 8 v781-v783 lessons → 3 new operative disciplines
**Engine state:** UNCHANGED (NASA degree sustains at 1.177 — 9 consecutive ships at this level, v777-v785)
**Wedge:** Audit strengthening lever S5 + T1.4 fragment (~2h)

## Summary

A focused operational chip directly sourced from the 2026-05-26 core-functions retrospective audit. Converts the social-rule "keep PROJECT.md fresh" pattern (the audit found GAP-6 stale-Open despite v1.49.572 closure; "Current Milestone" 115 versions behind) into a deterministic gate.

Three deliverables:

| Deliverable | Path |
|---|---|
| Normalizer tool | `tools/project-md-normalizer.mjs` (271 lines) |
| Test suite | `tools/__tests__/project-md-normalizer.test.mjs` (12 tests, all pass) |
| Pre-tag-gate integration | `tools/pre-tag-gate.sh` step 17/17 (WARN-only by default; promote via `SC_PRE_TAG_GATE_REQUIRE=project-md`) |

Plus a working-tree-only refresh of `.planning/PROJECT.md` GAP table:

| GAP | Before | After |
|---|---|---|
| GAP-1 | ADDRESSED (informal) | CLOSED (canonical) |
| GAP-2 | IN PROGRESS (stale phase reference) | IN PROGRESS (substrate complete at v1.49.572; consumer engine open) |
| GAP-6 | Open | CLOSED at v1.49.572 T1c via `docs/substrate/semantic-channel.md` |

GAP-3/4/5/7 were already correct.

## Why this ship

The audit's strengthening lever S5: PROJECT.md drift is the same class of bug as STATE.md drift (closed at v1.49.783) — prose that must mirror ground truth without a gate to enforce mirroring. The v585 → v784 gate-not-vigilance discipline says: convert offending social rules into deterministic gates rather than re-emphasizing prose discipline. This ship applies that discipline to PROJECT.md.

Audit T1.4 was sized as a 30-min fragment to bundle with the next forward-cadence ship. Operator chose to land the normalizer + the GAP refresh together as a standalone v1.49.785 ship, deferring NASA 1.178 forward-cadence by one ship.

## What the normalizer checks

1. **Required sections present** — "What This Is", "Core Value", "Current State", "Tech Stack", "Architecture Gaps" (BLOCK on absence)
2. **"Latest shipped release" version** — must equal package.json version OR predecessor patch (BLOCK on malformed; WARN on stale)
3. **GAP table well-formed** — every row has 4 columns; IDs match `GAP-\d+`; statuses in {CLOSED, ADDRESSED, IN PROGRESS, Open, N/A, Intentional design}
4. **"Last updated" freshness** — WARN if >30 days old

## What it does NOT do

The normalizer is `--check` only. It does not auto-rewrite PROJECT.md prose — that would be too destructive for a hand-authored document. Drift is surfaced; the operator hand-edits to resolve. This matches the conservative end of the spectrum that `tools/state-md-normalizer.mjs` (v1.49.783) sits on — STATE.md is structured frontmatter + generated body, PROJECT.md is prose-heavy with no machine-rewritable schema.

## Tier 1 audit roadmap (this ship = 1/N)

Per `.planning/AUDIT-2026-05-26-core-functions-retrospective.md` §4:

| Item | Ships | Status |
|---|---|---|
| T1.4 — PROJECT.md GAP refresh | (fragment) | **This ship** |
| S5 — PROJECT.md normalizer | 1 | **This ship** |
| T1.2 — Adoption telemetry weekly report | 2-3 | Queued |
| T1.1 — Bounded-learning calibration loop | 4-6 | Queued |
| T1.3 — College of Knowledge consumer engine | 3-5 | Queued |

## Counter-cadence accounting

This is the **9th consecutive non-engine-state ship** (v777 → v785). Cadence overdue marker per Lesson #10168/#10169/#10170: counter-cadence cleanup is productive every ~30 forward milestones. This is non-counter-cadence audit-driven work; NASA 1.178 forward-cadence advance remains queued.
