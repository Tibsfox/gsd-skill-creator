---
title: "Context"
chapter: 99-context
version: v1.49.961
date: 2026-06-03
summary: "Where v1.49.961 sits in the larger arc."
tags: [context, counter-cadence, two-layer-closure]
---

# v1.49.961 — Context

## Milestone metadata

- **Version:** v1.49.961
- **Type:** `feat(tools)` — STATE.md backup-file two-layer closure (counter-cadence #28)
- **Predecessor:** v1.49.960 (M4 intent-journal crash recovery for wedged commits)
- **NASA degree:** 1.178 (frozen hold)
- **Counter-cadence count:** 27 -> **28**

## Where this sits

v961 is the 4th two-layer closure (#10431/#10436) and the last item of the
operator's post-v958 "1 2 & 3" batch — shipped LAST, as the counter-cadence,
after the v959 detector lifts and the v960 M4 recovery (matching the convention
that a counter-cadence ships last so it can codify any drift the forward feats
accrue). It closes the final enumerated candidate in
`docs/two-layer-closure-discipline.md`, after STATE.md (v813), PROJECT.md (v954),
and release-notes scaffolding (v958, counter-cadence #27).

## Files changed

- `tools/state-md-clean-backups.mjs` (new) + `tools/__tests__/state-md-clean-backups.test.mjs` (new, 16 tests).
- `tools/state-md-set-shipped.mjs` — self-clean wire at the T14 reset.
- `tools/pre-tag-gate.sh` — step 19 detector + step-names vocab + the step 18/19
  `set -e` exit-code-capture fix.
- `tools/render-claude-md/env-vars.json` — bypass vocab + count-agnostic default.
- `vitest.tools.config.mjs` — cleaner test in the include list.
- `tests/integration/v1-49-961-meta-test.test.ts` (new) +
  `tests/integration/v1-49-869-meta-test.test.ts` (count-agnostic).
- `docs/two-layer-closure-discipline.md` — 4th-case-study record + off-cycle residual.

## Engine state at close

- NASA degree 1.178. Counter-cadence 28. Manifest 151 lessons. No
  `cadence_advances` marker.
