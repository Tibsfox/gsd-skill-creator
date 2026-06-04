---
title: "Context"
chapter: 99-context
version: v1.49.966
date: 2026-06-03
summary: "Where v1.49.966 sits in the larger arc."
tags: [context, tools, gate]
---

# v1.49.966 — Context

## Milestone metadata

- **Version:** v1.49.966
- **Type:** `fix(tools)` — pre-tag-gate self-consistency + exit-21 collision fix
- **Predecessor:** v1.49.965 (adoption-baseline freshness gate + tool)
- **NASA degree:** 1.178 (frozen)
- **Counter-cadence count:** 29 (unchanged)

## Where this sits

This is **Ship 0.2** of the implementation plan derived from the 2026-06-03
core-functions audit refresh — the gate-self-consistency item the v965
retrospective explicitly deferred ("denominator normalization + a step-count
parity test is the planned Ship 0.2"). It is independent of every other queued
ship and carries no runtime risk beyond a single diagnostic exit-code change. The
exit-21 collision it resolves was a latent defect introduced at v1.49.961 (cc#28)
and is the direct sibling of the exit-22 collision the v965 adversarial review
caught and fixed (→ 23).

## Files changed

Code commit (`fix(tools)`, 7 files):

- `tools/pre-tag-gate.sh` — denominators → `/20`; legend exit 15/19 corrected +
  exit 28/76 documented; state-backups `exit 21` → `exit 24`
- `tools/check-card-template-length.mjs` — stale `step 7.6/14` comment → `step 7.6`
- `tests/integration/pre-tag-gate-self-consistency.test.ts` *(new)* — 12-test
  drift-guard (denominator parity + legend accuracy + exit-code uniqueness)
- `tests/integration/v1-49-671-meta-test.test.ts` — denominator-agnostic
- `tests/integration/v1-49-869-meta-test.test.ts` — denominator-agnostic
- `tests/integration/v1-49-961-meta-test.test.ts` — denominator-agnostic + exit
  21 → 24 belief correction
- `tests/integration/v1-49-965-meta-test.test.ts` — denominator-agnostic (keeps
  the absolute-count ownership)

Release commit adds the regenerated `docs/ADOPTION-BASELINE-v1.49.966.{md,json}`,
`docs/ADOPTION-TRENDS.md`, and these release notes.

## Engine state at close

- NASA degree 1.178 (frozen) · counter-cadence 29 (unchanged) · manifest 151
  (unchanged) · no cadence_advances. dev = main parity restored at the FF after
  the chore(release).
