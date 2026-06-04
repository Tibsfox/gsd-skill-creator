---
title: "Context"
chapter: 99-context
version: v1.49.973
date: 2026-06-04
summary: "Where v1.49.973 sits in the larger arc."
tags: [context, docs, dispatch, harness]
---

# v1.49.973 — Context

## Milestone metadata

- **Version:** v1.49.973
- **Type:** `docs` — update sub-agent dispatch discipline for opus 4.8 harness
- **Predecessor:** v1.49.972 (park MA/MB/MD control-theory island + retire intrinsic-telemetry, D3)
- **NASA degree:** 1.178 (frozen)
- **Counter-cadence count:** 29 (unchanged — forward audit-plan ship)

## Where this sits

Ship 1.3 in Phase 1 ("harness dividend") of the 2026-06-03 core-functions audit plan, after Phase 0 (v965-v967), Ship 1.1 (v968, adversarial review codification), Ship 1.2 (v969, ME-2 actuator), Ship 2.1 (v970, examples/ de-hardcode), and D2/D3 (v971/v972). It is the documentation half of the "harness dividend" — capitalizing on the Opus 4.8 / Workflow-Agent primitives by stopping the dispatch discipline from misdirecting future work with premises codified for the older harness. It pairs with Ship 1.1's codified adversarial review, which this ship then dogfooded to catch its own over-claims.

## Files changed

- `docs/sub-agent-dispatch-discipline.md` — harness-update section; Architectural facts refined (Fact #1) and reaffirmed (Facts #2-4); checklist made actionable; post-trip salvage reframed as fallback.
- `tools/render-claude-md/disciplines.json` — "Sub-agent dispatch" summary annotated; #10158 added to `key_lessons`; codified_at_milestone note. (CLAUDE.md re-rendered, gitignored.)
- `project-claude/skills/gupp-propulsion/SKILL.md` + `references/runtime-strategies.md` — HAL note relocated to the references file (CF-H-030 budget), lean pointer in SKILL.md.
- `data/chipset/gastown-orchestration/gastown-orchestration.yaml` — HAL note (comment) on the runtime/polling section.

## Engine state at close

NASA degree **1.178** (frozen) · counter-cadence **29** (unchanged) · manifest lessons **152** (#10158 codified into Sub-agent dispatch).
