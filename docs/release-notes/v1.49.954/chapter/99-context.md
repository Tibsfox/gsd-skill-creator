---
title: "Context"
chapter: 99-context
version: v1.49.954
date: 2026-06-02
summary: "Where v1.49.954 sits in the larger arc."
tags: [context, tools, counter-cadence, project-md, two-layer-closure]
---

# v1.49.954 — Context

## Milestone metadata

- **Version:** v1.49.954
- **Type:** `feat(tools)` — PROJECT.md latest-shipped source eliminator (**counter-cadence #25**)
- **Predecessor:** v1.49.953 (structural wire detector for the cadence verify axis)
- **NASA degree:** 1.178 (unchanged — degree-non-advancing)
- **Counter-cadence count:** 24 -> **25**

## Where this sits

- Item 4 and the FINAL ship of the operator-directed "1 2 3 and 4" batch from the post-v1.49.950 handoff: (1) suggestions.* end-to-end tests [v1.49.951], (2) M4 crash-recovery [v1.49.952], (3) structural wire detector [v1.49.953], (4) counter-cadence #25 [this ship].
- The batch arc: three forward ships (a verify-coverage advance, an M4 crash-recovery fix, a verify-detector hardening), capped by a counter-cadence cleanup scoped by the `cadence --check` gate the batch itself built.

## How the scope was chosen

`skill-creator cadence --check` exits 0:

| Axis | Status | Why |
|---|---|---|
| codify | manual | 151 lessons; operator-tracked backlog |
| consume | not-overdue | 0 genuinely-unwired thresholds |
| calibrate | not-overdue | max 12 observations (< 20) |
| verify | not-overdue | all 7 wired thresholds structurally wire (post-v953) |

Nothing machine-overdue -> #25 targets hand-picked debt. The PROJECT.md hand-edit was the most-evidenced choice (surfaced twice in this batch; flagged open in the two-layer-closure ledger since v813).

## Files changed

- `tools/project-md-normalizer.mjs` — `--write` mode (`writeMode`, `LATEST_LINE_RE`, `PREDECESSOR_LINE_RE`, `getArgValue`, `EM_DASH`); docstring updated (`--write` now exists for the structured lines); dispatch `if (--write) writeMode() else main()`.
- `tools/__tests__/project-md-normalizer.test.mjs` — 5 new `--write` tests (W1-W5) + `makeProjectMdWithPredecessor` fixture.
- `docs/two-layer-closure-discipline.md` — PROJECT.md class moved from "open; flagged at v813" to "closed at v1.49.954"; parallel case study added.

## The closure (#10431)

| Layer | Ship | Mechanism |
|---|---|---|
| Detector | v1.49.785 | `project-md-normalizer.mjs --check` (pre-tag-gate step 17) — verifies the latest-shipped version vs package.json |
| Source eliminator | v1.49.954 (this) | `project-md-normalizer.mjs --write --version --name` — rotates latest-shipped -> predecessor, sets new latest-shipped, refreshes last-updated; idempotent + post-condition self-check; prose-preserving |

## Test posture

- Full `tools/` suite 783/783 (vitest.tools.config.mjs), incl. 17 normalizer tests (12 `--check` + 5 `--write`).
- Mutation-proven: dropping the `oldVersion !== version` idempotency guard clobbers the predecessor on re-run and fails the idempotency test.
- Dogfooded: v954's own PROJECT.md lines were set by `--write` (#10203 meta-test).

## Engine state at close

- NASA degree 1.178 (unchanged).
- Counter-cadence count **25** (this is the counter-cadence ship).
- Manifest: **151 lessons** (unchanged — applies #10431 / #10168 / #10428; records a carried-forward "close the oldest open two-layer-closure ledger entry" candidate; promotes none).

## References

- The eliminator: `tools/project-md-normalizer.mjs` (`--write`).
- The discipline: `docs/two-layer-closure-discipline.md` (#10431, PROJECT.md case study).
- The scoping gate: `src/cli/commands/cadence.ts` (`cadence --check`, built v947-950).
- The batch: v1.49.951 (suggestions verify), v1.49.952 (M4 crash-recovery), v1.49.953 (wire detector), v1.49.954 (this — counter-cadence #25). Batch complete.
