---
title: "Context"
chapter: 99-context
version: v1.49.975
date: 2026-06-04
summary: "Where v1.49.975 sits in the larger arc."
tags: [context, agents, adoption, ship-2.3]
---

# v1.49.975 — Context

## Milestone metadata

- **Version:** v1.49.975
- **Type:** `feat(agents)` — agent adoption scan + dormant-agent verdicts
- **Predecessor:** v1.49.974 (skills source-of-truth promotion + research-skill wires, Ship 2.2)
- **NASA degree:** 1.178 (frozen)
- **Counter-cadence count:** 29 (unchanged — forward audit-plan ship)

## Where this sits

Ship 2.3 in Phase 2 ("surface hygiene") of the 2026-06-03 core-functions audit plan, after Ship 2.2 (v974, skills source-of-truth). It gives the agent tier the adoption telemetry the `src/` tier got at v786 and the skills tier got a verdict-shaped answer for at v974 — completing the three-tier adoption picture (modules, skills, agents). The "retire dormant agents" half of the ship was refuted (the named candidates are description-dispatched/load-bearing), so it nets to telemetry + a verdict doc rather than relocation. It sets up Ship 2.4 (teams reconcile + chipset/cartridge doc fixes) and Ship 3.1 (reachability-aware adoption-scanner v2).

## Files changed

- `tools/agent-adoption-scan.mjs` (new) — the agent-tier adoption scanner.
- `tools/agent-adoption-scan.allowlist.json` (new) — 7 exemptions with per-agent reasons.
- `docs/AGENT-ADOPTION-VERDICTS.md` (new) + `docs/AGENT-ADOPTION-BASELINE.json` (new) — decision + snapshot surfaces.
- `src/cli/commands/agents.ts` — new `adoption` subcommand (routed through the `ProcessContext` chokepoint) + help; `src/cli/help.ts` — agents section.
- `tools/__tests__/agent-adoption-scan.test.mjs` (new) + `vitest.tools.config.mjs` (include-list entry) + `tests/integration/agent-adoption-allowlist-parity.test.ts` (new) — the two drift-guards.

## Engine state at close

NASA degree **1.178** (frozen) · counter-cadence **29** (unchanged) · manifest lessons **152** (unchanged).
