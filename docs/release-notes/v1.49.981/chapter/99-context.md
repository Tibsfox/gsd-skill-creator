---
title: "Context"
chapter: 99-context
version: v1.49.981
date: 2026-06-05
summary: "Where v1.49.981 sits in the larger arc."
tags: [context]
---

# v1.49.981 — Context

## Milestone metadata

- **Version:** v1.49.981
- **Type:** `feat(observation)` — Skill-mining default-on + bootstrap co-activation thresholds
- **Predecessor:** v1.49.980 (Co-activation consumer wire; tag `104f2a033`, post-ship HEAD `c45d3dd2a`)
- **NASA degree:** 1.178 (unchanged)
- **Counter-cadence count:** 29 (unchanged)

## Where this sits

This is Ship 5.1c, the third sub-ship of Phase 5's co-activation mechanism. v1.49.980 (5.1a + 5.1b) restored the `agents suggest` plumbing and added transcript skill-mining behind a default-OFF flag. 5.1c turns that flag ON and lowers the co-activation bar so the loop can begin accumulating real signal. It does not, on its own, surface a suggestion: at current data volume the binding constraint is data, not thresholds. The next forward steps on Phase 5 are a re-audit checkpoint once post-flip volume accrues, Ship 5.2 (retention outcome-driven fix — the F4 debt, open operator target-band decision), and Ship 5.3 (GAP-7 trip-vocab check).

## Files changed

Source (7): `src/integration/config/schema.ts`, `src/integration/config/types.ts`, `src/cli/commands/gsd-init.ts`, `project-claude/install.cjs`, `src/agents/agent-suggestion-manager.ts`, `src/observation/session-observer.ts` (comment), `src/hooks/session-end.ts` (comment).
Tests (2): `src/integration/config/schema.test.ts`, `src/agents/agent-suggestion-manager.test.ts`.

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 (atomic directive state) + Lesson #10184 (single-step main FF) + Lesson #10197 (STORY-gate post-bump-version). Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- Pre-flight adversarial review (step P) ran the reusable workflow on the diff; 14 refuted / 1 confirmed-and-fixed.
- No new release-notes-specific gates; bootstrap thresholds live at the `AgentSuggestionManager` layer (no IntegrationConfig schema section added in 5.1c).

## Engine state at close

NASA degree **1.178** · counter-cadence **29** · manifest lessons **152** — all unchanged.
