---
title: "Context"
chapter: 99-context
version: v1.49.971
date: 2026-06-04
summary: "Where v1.49.971 sits in the larger arc."
tags: [context]
---

# v1.49.971 — Context

## Milestone metadata

- **Version:** v1.49.971
- **Type:** `refactor(teams)` — mark agent-teams primitive dormant (D2)
- **Predecessor:** v1.49.970 (de-hardcode examples/ catalog tooling + re-catalog storefront), chore-release `1c6c6af52`
- **NASA degree:** 1.178 (frozen)
- **Counter-cadence count:** 29 (unchanged — forward audit-plan ship)

## Where this sits

D2 of the 2026-06-03 core-functions audit plan (`.planning/IMPLEMENTATION-PLAN-2026-06-03.md`). The four audit decision-gates D1–D4 were settled 2026-06-03; the Phase 0/1/2 ships (v1.49.965–970) executed first. This is the first of the two D2/D3 ships — v1.49.971 = D2 (team dormancy); v1.49.972 = D3 (park the MA/MB/MD control-theory island + retire `intrinsic-telemetry`). The settled D2 mechanism ("relocate to `examples/dormant-teams/`") was revised after v1.49.970's catalog de-hardcode made the separate-dir rationale obsolete; the operator approved decommission-in-place on 2026-06-04. The disposition's resume condition is capability-based (a team-execution runtime landing), deliberately not v1.50-specific, with a dated retire-or-resume review gate (2027-06-04).

## Files changed

- **Source:** `src/cli/commands/team-spawn.ts` (removed `offerInteractiveFix` + its import; spawn is now a readiness check only; docstrings/help/JSDoc updated).
- **Install source-of-truth:** `project-claude/manifest.json` (removed 4 team standalone entries); deleted `project-claude/teams/{code-review-team,doc-generation-team,gsd-debug-team,gsd-research-team}/config.json`.
- **Catalog (reference examples):** `examples/teams/{code/code-review-team,migration/doc-generation-team,migration/gsd-research-team,ops/gsd-debug-team}/README.md` (dormant banners).
- **Docs:** `docs/AGENT-TEAMS-DORMANT.md` (new); `docs/AGENT-TEAMS.md` (banner).
- **Test:** `tests/integration/agent-teams-dormant.test.ts` (new drift-guard).
- **Release/engine:** version manifests; `docs/release-notes/STORY.md`; `docs/ADOPTION-BASELINE-v1.49.971.{md,json}`; `docs/ADOPTION-TRENDS.md`.

## Engine state at close

NASA degree **1.178** (frozen) · counter-cadence **29** · manifest lessons **151** — all unchanged. Forward audit-plan ship; no engine counters advance.

## T14 ship sequence (operator-only authorization)

Operator authorized the full T14 ship ("D2/D3" + "Run full T14 — ship v971"). Per Lesson #10191 (atomic directive state) + Lesson #10184 (single-step main FF) + Lesson #10197 (STORY-gate post-bump-version). Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- Step P adversarial review run on the committed diff (`HEAD~1`); 1 MAJOR finding (stale JSDoc) fixed in code and amended pre-push.
- Gate enforced via the existing vitest step (drift-guard test), not a new pre-tag-gate shell step.
