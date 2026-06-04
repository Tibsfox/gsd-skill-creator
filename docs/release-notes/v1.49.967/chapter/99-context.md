---
title: "Context"
chapter: 99-context
version: v1.49.967
date: 2026-06-04
summary: "Where v1.49.967 sits in the larger arc."
tags: [context, examples, catalog]
---

# v1.49.967 — Context

## Milestone metadata

- **Version:** v1.49.967
- **Type:** `fix(examples)` — examples/ catalog frontmatter hygiene
- **Predecessor:** v1.49.966 (pre-tag-gate self-consistency + exit-21 collision fix)
- **NASA degree:** 1.178 (frozen)
- **Counter-cadence count:** 29 (unchanged)

## Where this sits

This is **Ship 0.3** of the implementation plan derived from the 2026-06-03
core-functions audit refresh — the "stray-artifact + frontmatter hygiene" item in
Phase 0 (regression close-out). It follows Ship 0.1 (adoption-baseline freshness
gate, v1.49.965) and Ship 0.2 (pre-tag-gate self-consistency, v1.49.966). It is
independent of every other queued ship and carries no runtime risk: it touches
only catalog *metadata* in examples/, not any executable surface. The next ship
in this session is the substantive **Ship 1.1** — codifying the adversarial
Workflow review as a load-bearing ship step.

## Files changed

Code commit (`fix(examples)`, 5 files, +14 lines):

- `examples/skills/gsd/cartridge-forge/SKILL.md` — +7 catalog fields + `superseded_by`
- `examples/chipsets/astronomy-department/README.md` — +`modified` +`first_path`
- `examples/chipsets/environmental-department/README.md` — +`modified` +`first_path`
- `examples/chipsets/digital-literacy-department/README.md` — +`modified`
- `examples/chipsets/logic-department/README.md` — +`modified`

Also removed the untracked local-only `.claude/skills/test-skill/` (no git
footprint). The `examples/.count-badge.md` catalog drift was confirmed
pre-existing and deliberately **not** changed (reserved for Ship 2.1).

Release commit adds the regenerated `docs/ADOPTION-BASELINE-v1.49.967.{md,json}`,
`docs/ADOPTION-TRENDS.md`, `docs/release-notes/STORY.md`, and these release notes.

## Engine state at close

- NASA degree 1.178 (frozen) · counter-cadence 29 (unchanged) · manifest 151
  (unchanged) · no cadence_advances. dev = main parity restored at the FF after
  the chore(release).
