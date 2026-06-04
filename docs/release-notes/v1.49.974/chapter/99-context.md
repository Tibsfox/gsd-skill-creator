---
title: "Context"
chapter: 99-context
version: v1.49.974
date: 2026-06-04
summary: "Where v1.49.974 sits in the larger arc."
tags: [context, skills, source-of-truth, ship-2.2]
---

# v1.49.974 — Context

## Milestone metadata

- **Version:** v1.49.974
- **Type:** `feat(skills)` — skills source-of-truth promotion + research-skill wires
- **Predecessor:** v1.49.973 (update sub-agent dispatch discipline for opus 4.8 harness, Ship 1.3)
- **NASA degree:** 1.178 (frozen)
- **Counter-cadence count:** 29 (unchanged — forward audit-plan ship)

## Where this sits

Ship 2.2 in Phase 2 ("surface hygiene") of the 2026-06-03 core-functions audit plan, after Ship 2.1 (v970, examples/ de-hardcode) and Ship 1.3 (v973, dispatch-discipline harness update). It closes the skills tier's clean-install reproducibility gap and gives the 4 arxiv research skills real callers — the skills-tier analog of the src/ adoption work. It sets up Ship 2.3 (agent adoption scan + retire dormant agents) and the noted per-skill activation-counter follow-on.

## Files changed

- `project-claude/skills/{adversarial-pr-review,image-to-mission,token-budget,execution-grounded-selection,intent-router,skill-counterfactual-audit,spectral-topology-preflight}/SKILL.md` — promoted into source-of-truth (3 keepers also brought to CF-H-032 spec; adversarial-pr-review guardrail reworded for the harness-integrity scanner).
- `project-claude/skills/skill-integration/SKILL.md` — wired `skill-counterfactual-audit` (skill-lifecycle audit gate).
- `project-claude/skills/team-control/SKILL.md` — wired `spectral-topology-preflight` (team pre-flight).
- `project-claude/commands/wrap/execute.md`, `project-claude/commands/wrap/verify.md` — wired `intent-router` (both) + `execution-grounded-selection` (verify).
- `docs/skills-source-of-truth.md` (new) + `tests/integration/skills-source-of-truth.test.ts` (new drift-guard).

## Engine state at close

NASA degree **1.178** (frozen) · counter-cadence **29** (unchanged) · manifest lessons **152** (unchanged).
