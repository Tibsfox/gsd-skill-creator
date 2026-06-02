---
title: "Context"
chapter: 99-context
version: v1.49.947
date: 2026-06-01
summary: "Where v1.49.947 sits in the larger arc."
tags: [context, cli, counter-cadence, gate-not-vigilance, meta-cadence]
---

# v1.49.947 — Context

## Milestone metadata

- **Version:** v1.49.947
- **Type:** Counter-cadence #24 (gate-not-vigilance / discipline-as-code; `feat` CLI)
- **Predecessor:** v1.49.946 (honor observation.max_entries in the session-end prune)
- **NASA degree:** 1.178 (unchanged — degree-non-advancing)
- **Counter-cadence count:** 24 (prior #23 = v1.49.944; v945 fix + v946 feat were not counter-cadence)

## Where this sits

- The third of a three-ship operator-directed batch: v1.49.945 (cargo keystore test-race fix), v1.49.946 (observation.max_entries consume wire), and this ship (the cadence CLI). All three were named in the post-v944 handoff's forward-candidate list.
- It is the counter-cadence follow-up the v1.49.944 retrospective explicitly called for: "the prose overdue-check was misapplied twice this session — fresh evidence for making it a deterministic gate (gate-not-vigilance / discipline-as-code candidate for a future counter-cadence)."
- It joins the lineage of gate-not-vigilance counter-cadence ships (the macOS/cargo flip-readiness gates, the STATE.md atomic-writer, the STORY auto-append gate) — each converting a misapplication-prone operator step into a deterministic surface.

## Files changed

- `src/cli/commands/cadence.ts` (new, ~290 lines) — the `cadence` command: per-axis `not-overdue`/`candidate`/`manual` verdicts; pure `calibrateVerdict` helper; `--axis` / `--check` / `--json` flags; exit codes (0 not-overdue, 1 candidate, 2 invalid-axis).
- `src/cli/commands/cadence.test.ts` (new, ~110 lines) — 14 tests (drift guard, calibrate conjunct boundary, consume catch-all-proof, command surface); 2 mutation-proven.
- `src/bounded-learning/types.ts` — `ALL_CALIBRATABLE_THRESHOLDS` runtime array + `as const satisfies` + `_AllThresholdsCovered` compile-time completeness guard.
- `src/cli/dispatch.ts` — `cadence` / `cad` alias registration.
- `docs/meta-cadence-discipline.md` — forward-shadow section rewritten as "realized at v1.49.947" with the honest per-axis scope.
- `docs/release-notes/v1.49.947/` — milestone notes (README + 00/03/04/99 chapters).

## The two errors this tool defeats (v1.49.944)

| Axis | The mis-read | The deterministic check |
|---|---|---|
| calibrate | `>=20 observations` read as met; max was 12 | reads ACTUAL observation count per wired threshold; `max 12 < 20 -> not overdue` |
| consume | `wired:false` string-matched the defensive catch-all branches | iterates the REAL `CalibratableThreshold` union members; `0 genuinely-unwired -> not overdue` |

## Test posture

- `npx tsc --noEmit` clean.
- `cadence.test.ts` 14/14; affected scope (`src/cli`, `src/bounded-learning`) 809/809.
- Mutation-proofs: calibrate `>=20` boundary (`>=`->`>` reds "exactly 20 -> candidate"); compile-time drift guard (drop a member from the array -> TS2322).
- End-to-end on the live repo across all four invocation shapes.
- Full vitest suite green standalone (35684 passed). Pre-tag-gate 17/18; `vitest` step bypassed (operator-authorized this batch) for the pre-existing M4 branches concurrency flake under local high-parallelism contention — filed as a follow-up; CI is the backstop.

## Engine state at close

- NASA degree 1.178 (unchanged).
- Counter-cadence count 24.
- Manifest: **151 lessons** (unchanged — realizes the meta-cadence forward-shadow; applies #10428 / #10461 / #10427; promotes none).
- Architecture gaps: 6/7 closed-or-intentional (unchanged).

## References

- The realized forward-shadow: `docs/meta-cadence-discipline.md` (the four axes + the now-built tool).
- The command: `src/cli/commands/cadence.ts`; the threshold enumeration + drift guard: `src/bounded-learning/types.ts`.
- The observation-source registry the consume/calibrate axes read: `src/bounded-learning/observation-sources.ts`.
- The session that supplied the misapplication evidence: v1.49.944 (counter-cadence #23 consume).
- The counter-cadence discipline envelope: `docs/counter-cadence-discipline.md`.
