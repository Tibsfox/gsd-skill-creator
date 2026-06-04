---
title: "Context"
chapter: 99-context
version: v1.49.968
date: 2026-06-04
summary: "Where v1.49.968 sits in the larger arc."
tags: [context, ship-pipeline, review]
---

# v1.49.968 — Context

## Milestone metadata

- **Version:** v1.49.968
- **Type:** `feat(ship-review)` — codify adversarial pre-push ship review
- **Predecessor:** v1.49.967 (examples/ catalog frontmatter hygiene)
- **NASA degree:** 1.178 (frozen)
- **Counter-cadence count:** 29 (unchanged)

## Where this sits

This is **Ship 1.1** of the implementation plan derived from the 2026-06-03
core-functions audit refresh — the ⭐⭐ highest-leverage item in Phase 1 ("harness
dividend"). It follows the Phase 0 regression close-outs: Ship 0.1 (adoption-baseline
gate, v965), Ship 0.2 (pre-tag-gate self-consistency, v966), and Ship 0.3
(examples/ frontmatter hygiene, v967). It codifies the exact mechanism that produced
the audit and the plan, and that caught real BLOCKERs/MAJORs on the three ships that
preceded it. It is independent of every other queued ship. Next in the plan: Ship 1.2
(wire the ME-2 model-affinity actuator) and Ship 2.1 (examples/ tooling de-hardcode +
re-catalog + gate, which also owns the count-badge drift v967 deferred).

## Files changed

Code commit (`feat(ship-review)`, 5 files):

- `tools/ship-review/adversarial-ship-review.mjs` *(new)* — reusable five-lens
  review Workflow (read-only Explore reviewers → adversarial verify)
- `docs/adversarial-ship-review.md` *(new)* — canonical process doc
- `docs/T14-SHIP-SEQUENCE.md` — new pre-flight step P + changelog
- `tests/integration/adversarial-ship-review-discipline.test.ts` *(new)* —
  mutation-proven drift-guard
- `tools/render-claude-md/disciplines.json` — "Ship pipeline" discipline extended
  (CLAUDE.md re-rendered, gitignored, not committed)

Release commit adds the regenerated `docs/ADOPTION-BASELINE-v1.49.968.{md,json}`,
`docs/ADOPTION-TRENDS.md`, `docs/release-notes/STORY.md`, and these release notes.

## Engine state at close

- NASA degree 1.178 (frozen) · counter-cadence 29 (unchanged) · manifest 151
  (unchanged) · no cadence_advances. dev = main parity restored at the FF after
  the chore(release).
