---
title: "Context"
chapter: 99-context
version: v1.49.977
date: 2026-06-05
summary: "Where v1.49.977 sits in the larger arc."
tags: [context]
---

# v1.49.977 — Context

## Milestone metadata

- **Version:** v1.49.977
- **Type:** `feat` — reachability-aware adoption scanner
- **Predecessor:** v1.49.976 (`9b1850983`)
- **NASA degree:** 1.178 (frozen)
- **Counter-cadence count:** 29

## Where this sits

Ship 3.1 of the 2026-06-03 core-functions audit plan, opening Phase 3 (substrate
disposition). Phase 2 (surface hygiene) closed at v1.49.976. Ship 3.1 has no
remaining deps (Ship 0.1, the gated adoption baseline, shipped at v1.49.965). It
builds the reachability dimension that Ship 3.2 consumes: the 16 non-allowlisted
`living`-but-unreachable modules this scan surfaces are the Ship 3.2 triage input
(dispose / wire / allowlist each, plus the open `upstream`/`upstream-intelligence`
triage). The dimension also confirms in tooling the v1.49.972 D3 park: 7/8
control-theory island modules are statically unreachable from production.

## Files changed

Feature commit (`a3282ebf7`):

- `tools/adoption-scan.mjs` — reachability dimension (resolveToFile,
  computeReachableModules, REACHABILITY_ROOTS + PRODUCTION_EXTERNAL_DIRS,
  `reachableFromProduction` field, baseline-`.md` section, exports + main guard,
  header doc).
- `tools/__tests__/adoption-scan.test.mjs` — T17–T22 hermetic reachability units.
- `tests/integration/learning-substrate-parked.test.ts` — live-scan reachability
  drift-guard pinning the island verdict.
- `docs/SHELFWARE-VERDICTS.md` — reachability-dimension section + island row update.
- `docs/learning-substrate-parked.md` — reachability-v2 verdict (gap closed).

Release commit additionally carries the 4 version manifests, the
`ADOPTION-BASELINE-v1.49.977.{json,md}` snapshot, `ADOPTION-TRENDS.md`, the public
`docs/release-notes/STORY.md`, and these 5 release-notes files.

## Engine state at close

NASA degree 1.178 (frozen) · counter-cadence 29 · manifest 152 — all unchanged
(forward audit-plan ship; no new lesson promoted).
