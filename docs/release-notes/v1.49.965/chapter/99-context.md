---
title: "Context"
chapter: 99-context
version: v1.49.965
date: 2026-06-03
summary: "Where v1.49.965 sits in the larger arc."
tags: [context, tools, adoption]
---

# v1.49.965 — Context

## Milestone metadata

- **Version:** v1.49.965
- **Type:** `feat(tools)` — adoption-baseline freshness gate + tool
- **Predecessor:** v1.49.964 (M4 orphan trunk-tmp cleanup on commit-lock reap)
- **NASA degree:** 1.178 (frozen)
- **Counter-cadence count:** 29 (unchanged)

## Where this sits

This is **Ship 0.1** of the implementation plan derived from the 2026-06-03
core-functions audit refresh — the first execution ship after that audit's four
decision-gates (D1–D4) were settled. Phase 0 of the plan is "regression
close-out"; this is its highest-trust item (audit T1.3), independent of every
decision-gate, and additionally a prerequisite for the later D3 island-park work
(which must record against a re-armed, gated baseline rather than a frozen one).

## Files changed

Code commit (`feat(tools)`, 8 files):

- `tools/adoption-baseline-freshness.mjs` *(new)* — the freshness detector tool
- `tools/__tests__/adoption-baseline-freshness.test.mjs` *(new)* — 17 tests
- `tools/pre-tag-gate.sh` — step 20 `adoption-freshness` + exit-code doc + help-log
- `tools/render-claude-md/env-vars.json` — bypass/require vocab + new `SC_ADOPTION_BASELINE_MAX_DRIFT`
- `vitest.tools.config.mjs` — registered the new tool test
- `docs/T14-SHIP-SEQUENCE.md` — step 2.7 (`adoption-refresh`) + changelog
- `tests/integration/v1-49-961-meta-test.test.ts` — made count-agnostic
- `tests/integration/v1-49-965-meta-test.test.ts` *(new)* — owns "all 20 checks"

Release commit adds the regenerated `docs/ADOPTION-BASELINE-v1.49.965.{md,json}`,
`docs/ADOPTION-TRENDS.md`, `dashboard/adoption.html`, and these release notes.

## Engine state at close

- NASA degree 1.178 (frozen) · counter-cadence 29 (unchanged) · manifest 151
  (unchanged) · no cadence_advances. dev = main parity restored at the FF after
  the chore(release).
