---
title: "Context"
chapter: 99-context
version: v1.49.962
date: 2026-06-03
summary: "Where v1.49.962 sits in the larger arc."
tags: [context, counter-cadence, drift-guard]
---

# v1.49.962 — Context

## Milestone metadata

- **Version:** v1.49.962
- **Type:** `feat(tools)` — bypass-vocab parity drift-guard (counter-cadence #29)
- **Predecessor:** v1.49.961 (counter-cadence #28 — `.planning/` backup-file
  two-layer closure)
- **NASA degree:** 1.178 (unchanged)
- **Counter-cadence count:** #29

## Where this sits

This is the counter-cadence ship the operator selected from the post-v1.49.961
handoff's named follow-ups: the bypass-vocab drift-guard, flagged as a v1.49.961
review NIT. Where v1.49.961 closed the `.planning/` backup-file drift class with a
two-layer closure, v1.49.962 closes a documentation-vs-reality drift class for the
pre-tag-gate's bypass vocabulary using the #10461 Layer-2 pattern (pin the
documented surface to the code-derived ground truth). The two-layer-closure
candidate list emptied at v1.49.961; this ship draws from the separate named-
follow-up list, leaving the drift-guard surface covered.

## Files changed

- `tests/integration/bypass-vocab-parity.test.ts` — NEW drift-guard (7 assertions).
- `tools/pre-tag-gate.sh` — runtime step-names help log reconciled to the 21 honored
  tokens; two header-comment vocab blocks de-enumerated to pointers.
- `tools/render-claude-md/env-vars.json` — `SC_PRE_TAG_GATE_BYPASS` vocabulary
  reconciled to the 21 honored tokens.
- `CLAUDE.md` — re-rendered from `env-vars.json` (gitignored; verified by the
  render `--check` gate step, not staged).

## Engine state at close

- NASA degree 1.178 (frozen hold). Counter-cadence #29. Manifest lessons 151
  (unchanged — applies #10461 / #10450 / #10427). cadence_advances: none. No new
  gate step (gate count stays 19).
