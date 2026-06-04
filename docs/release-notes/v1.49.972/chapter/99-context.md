---
title: "Context"
chapter: 99-context
version: v1.49.972
date: 2026-06-04
summary: "Where v1.49.972 sits in the larger arc."
tags: [context]
---

# v1.49.972 — Context

## Milestone metadata

- **Version:** v1.49.972
- **Type:** `refactor(substrate)` — park MA/MB/MD control-theory island + retire intrinsic-telemetry (D3)
- **Predecessor:** v1.49.971 (mark agent-teams primitive dormant, D2), chore-release `6433905dc`
- **NASA degree:** 1.178 (frozen)
- **Counter-cadence count:** 29 (unchanged — forward audit-plan ship)

## Where this sits

D3 of the 2026-06-03 core-functions audit plan (`.planning/IMPLEMENTATION-PLAN-2026-06-03.md`). The four audit decision-gates D1–D4 were settled 2026-06-03; an 8-agent verification pass refuted the plan's original D3 recommendation ("wire ace → selector") on the verified premise that `ace` is the import SINK. This is the second of the two D2/D3 ships — v1.49.971 = D2 (team dormancy); v1.49.972 = D3. It completes the D2/D3 ask. The remaining audit-plan forward motion (Ship 1.3 harness-obsolescence doc sweep, Ship 2.2 skills source-of-truth, Ship 3.1 reachability-aware scanner v2, Ship 3.2 the broader watch-list, D4 design pass + the retention-substrate fix) is unstarted.

## Files changed

- **Park (observability/docs):** `tools/adoption-scan.allowlist.json` (+8 entries); `docs/learning-substrate-parked.md` (new); `docs/SHELFWARE-VERDICTS.md` (ALLOWLISTED + RETIRED rows).
- **Retire (source):** deleted `src/intrinsic-telemetry/` (5 files); `src/heuristics-free-skill-space/{settings.ts,index.ts,__tests__/integration.test.ts}` (un-registered); `src/skill-isotropy/{types.ts,audit.ts}` + `src/sigreg/SKILL.md` (dangling prose refs); `INVENTORY-MANIFEST.json` (regenerated, 153 subsystems).
- **Test:** `tests/integration/learning-substrate-parked.test.ts` (new drift-guard).
- **Release/engine:** version manifests; `docs/release-notes/STORY.md`; `docs/ADOPTION-BASELINE-v1.49.972.{md,json}`; `docs/ADOPTION-TRENDS.md`.

## Engine state at close

NASA degree **1.178** (frozen) · counter-cadence **29** · manifest lessons **151** — all unchanged. Forward audit-plan ship; no engine counters advance.

## T14 ship sequence (operator-only authorization)

Operator authorized D2/D3 + chose two milestones; the v972 release leg was confirmed explicitly ("Ship v972 — finish the release"). Per Lesson #10191 (atomic directive state) + #10184 (single-step main FF) + #10197 (STORY-gate post-bump-version). Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- Step P adversarial review run on the committed diff (`HEAD~1`); 0 confirmed findings.
- CI on the first push failed on `INVENTORY-MANIFEST.json` drift (subsystem deletion); regenerated the manifest, amended the commit, force-with-lease re-pushed dev, CI green — all before the main FF.
- Gate enforced via the existing vitest step (drift-guard test), not a new pre-tag-gate shell step.
