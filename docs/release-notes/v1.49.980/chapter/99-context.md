---
title: "Context"
chapter: 99-context
version: v1.49.980
date: 2026-06-05
summary: "Where v1.49.980 sits in the larger arc."
tags: [context]
---

# v1.49.980 — Context

## Milestone metadata

- **Version:** v1.49.980
- **Type:** `feat(observation)` — Co-activation consumer wire
- **Predecessor:** v1.49.979 (`9fa59b430` — sc-learn + scan-arxiv CLI dispatch wire)
- **NASA degree:** 1.178 (unchanged)
- **Counter-cadence count:** 29 (unchanged — forward feat, not a codify ship)

## Where this sits

This opens **Phase 5 (strategic capability)** of the 2026-06-03 core-functions audit plan — the strategic learning loop that had been flat for ~120 ships. Phases 0–3 of that plan are effectively complete (v965–v979); Phase 4 (cross-platform) remains. Ship 5.1 is the loop-capability design pass plus the build of its chosen mechanism (co-activation consumer). The two strongest follow-ons it sets up: flipping `observation.mine_active_skills` on with cluster-detector threshold tuning (5.1c), and the outcome-driven retention-substrate fix that gates any future calibration tick (Ship 5.2 / the F4 debt).

## Files changed

- `src/agents/agent-suggestion-manager.ts` (+ new `.test.ts`) — envelope unwrap in `loadSessions`.
- `src/dashboard/collectors/session-collector.ts` (+ `.test.ts`) — same envelope unwrap (second victim).
- `src/observation/transcript-parser.ts` (+ `.test.ts`) — new `extractActiveSkills`.
- `src/observation/session-observer.ts` (+ `.test.ts`) — flag-gated skill-mining in `onSessionEnd`.
- `src/hooks/session-end.ts` — read flag, thread to observer; updated the stale comment.
- `src/integration/config/{schema,types}.ts` (+ `schema.test.ts`, `reader.test.ts`) — `mine_active_skills` flag.
- `src/cli/commands/gsd-init.ts`, `project-claude/install.cjs` — flag in config templates.
- `src/dashboard/{budget-silicon-collector,terminal-integration}.test.ts` — config-literal fixtures updated for the new field.
- `docs/retention-substrate-outcome-driven-debt.md` — F4 debt record (separate `docs:` commit).

## Engine state at close

NASA degree **1.178** · counter-cadence **29** · manifest lessons **152** — all unchanged.
