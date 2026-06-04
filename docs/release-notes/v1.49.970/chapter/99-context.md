---
title: "Context"
chapter: 99-context
version: v1.49.970
date: 2026-06-04
summary: "Where v1.49.970 sits in the larger arc."
tags: [context]
---

# v1.49.970 — Context

## Milestone metadata

- **Version:** v1.49.970
- **Type:** `feat(examples)` — de-hardcode examples/ catalog tooling + re-catalog storefront
- **Predecessor:** v1.49.969 (ME-2 model-affinity dispatch actuator), chore-release `7052675eb`
- **NASA degree:** 1.178 (frozen)
- **Counter-cadence count:** 29 (unchanged — forward ship)

## Where this sits

Ship 2.1 of the 2026-06-03 core-functions audit plan (`.planning/IMPLEMENTATION-PLAN-2026-06-03.md`), Phase 2 (surface hygiene). It follows the Phase 0/1 ships v1.49.965–969 (adoption-baseline gate, pre-tag-gate self-consistency, examples frontmatter hygiene, adversarial-review codification, ME-2 actuator). Where Ship 0.3 (v1.49.967) fixed the 13 frontmatter errors the validator *could* see, this ship removes the reason it couldn't see most of the storefront: the frozen category allowlists. The deferred `.count-badge.md` chipsets drift named in the v1.49.967 handoff is closed here as part of the full re-catalog. Next in the plan: D2/D3 execution (relocate dormant demo teams; park the control-theory island) and Ship 1.3 (harness-obsolescence doc sweep).

## Files changed

- **Tooling:** `examples/tools/catalog-core.mjs` (new); `examples/tools/{install,validate,catalog-gen,generate-category-readmes,license-report,backfill-frontmatter}.mjs` (de-hardcoded).
- **Content/structure:** deleted `examples/skills/{vision-to-mission,research-mission-generator}/` (stale dups); `examples/agents/gsd-meta/{pipeline-reconciler,quality-drift-watcher}/AGENT.md` (normalized from flat files); `examples/skills/gsd-meta/*/SKILL.md` ×5 (backfilled).
- **Regenerated:** `examples/.count-badge.md`; 125 new `examples/{skills,agents,teams}/<category>/README.md`; `examples/CATEGORIES.md`; `examples/CHANGELOG.md`.
- **Test:** `tests/integration/examples-catalog-parity.test.ts` (new drift-guard).
- **Release/engine:** version manifests; `docs/release-notes/STORY.md`; `docs/ADOPTION-BASELINE-v1.49.970.{md,json}`; `docs/ADOPTION-TRENDS.md`; `dashboard/adoption.html`.

## Engine state at close

NASA degree **1.178** (frozen) · counter-cadence **29** · manifest lessons **151** — all unchanged. This is a forward surface-hygiene ship; no engine counters advance.

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 (atomic directive state) + Lesson #10184 (single-step main FF) + Lesson #10197 (STORY-gate post-bump-version). Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- Step P adversarial review run on the 3-commit diff (`HEAD~3`); 1 MINOR finding fixed in code pre-push.
- Gate enforced via the existing vitest step (drift-guard test), not a new pre-tag-gate shell step.
