---
title: "Context"
chapter: 99-context
version: v1.49.950
date: 2026-06-02
summary: "Where v1.49.950 sits in the larger arc."
tags: [context, cli, cadence, meta-cadence, ships-since]
---

# v1.49.950 — Context

## Milestone metadata

- **Version:** v1.49.950
- **Type:** `feat(cli)` — cadence ships-since (second-conjunct) machine-tracking (NOT counter-cadence)
- **Predecessor:** v1.49.949 (harden the cadence verify axis)
- **NASA degree:** 1.178 (unchanged — degree-non-advancing)
- **Counter-cadence count:** 24 (unchanged — a `feat`)

## Where this sits

- Item 3 and the FINAL ship of the operator-directed "1 2 3" batch from the post-v1.49.947 handoff: (1) fix the M4 double-win [v1.49.948], (2) harden the cadence verify heuristic [v1.49.949], (3) add per-axis ships-since tracking so `cadence --check` becomes a true gate [this ship].
- It completes the meta-cadence tool arc: v1.49.947 built the FIRST-conjunct surface (defeating the v944 mis-reads); v1.49.949 hardened the verify axis's detection; this ship adds the SECOND conjunct (ships-since) and the `overdue` gate verdict.
- It realizes the second half of the v1.49.947 retrospective's carried-forward pattern ("deterministic first-conjunct surface + operator-tracked second conjunct") — the second conjunct is now machine-tracked too.

## Files changed

- `src/cli/commands/cadence.ts` — `CADENCE_SHIPS_SINCE_CONJUNCT`; `cadence_advances` regex + `readAxisAdvances` + `compareVersions`; `overdue` added to `CadenceStatus`; `shipsSinceUpgrade` + `cadenceCheckExitCode` + `applyShipsSince`; `releaseNotesDir` option; `--check` exit semantics shifted to fire on `overdue`; `[OVERDUE]` tag + `overdueCount` JSON; module docstring + exit-code table updated.
- `src/cli/commands/cadence.test.ts` — 12 new tests (ships-since machinery + the end-to-end overdue upgrade).
- `docs/release-notes/v1.49.944/README.md`, `docs/release-notes/v1.49.946/README.md` — tagged `cadence_advances: [consume]` (the first real producers).
- `docs/meta-cadence-discipline.md` — "Honest limit" rewritten as "Second conjunct (machine-tracked at v1.49.950)".

## The conjunct, now fully machine-tracked

| Axis | First conjunct (live state) | Second conjunct (this ship) | Live verdict |
|---|---|---|---|
| calibrate | wired threshold with `>=20` observations | `>=10` ships since `cadence_advances:[calibrate]` | not-overdue (max 12 < 20) |
| consume | a genuinely `wired:false` member | `>=10` ships since `[consume]` (anchored v1.49.946) | not-overdue (0 unwired) |
| verify | a wired threshold with no dedicated end-to-end test | `>=10` ships since `[verify]` (untagged -> unknown) | candidate (3 suggestions.*) |
| codify | `>=5` ESTABLISHED candidates (no machine signal) | `>=10` ships since `[codify]` | manual |

## Test posture

- `npx tsc --noEmit` clean.
- `cadence.test.ts` 35/35 (23 prior + 12 new). Affected scope (`src/cli`, `src/bounded-learning`) 916/916.
- Mutation-proven: `>=10` -> `>10` keeps `shipsSince=10` at `candidate`, failing the overdue end-to-end test.
- Focused single-agent adversarial review (see chapters for verdict).

## Engine state at close

- NASA degree 1.178 (unchanged).
- Counter-cadence count 24 (unchanged — a `feat`).
- Manifest: **151 lessons** (unchanged — completes the meta-cadence tool; applies #10428 / #10461 / #10427; records a carried-forward candidate; promotes none).

## References

- The tool: `src/cli/commands/cadence.ts` (the ships-since reader + `shipsSinceUpgrade` + the gate).
- The discipline: `docs/meta-cadence-discipline.md` ("Second conjunct (machine-tracked at v1.49.950)").
- The seed producers: `docs/release-notes/v1.49.944/README.md` + `v1.49.946/README.md` (`cadence_advances: [consume]`).
- The batch: v1.49.948 (M4 fix), v1.49.949 (verify hardening), v1.49.950 (this ship).
