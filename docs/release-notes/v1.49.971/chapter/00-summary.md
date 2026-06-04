# v1.49.971 — Summary

## The ship

D2 of the 2026-06-03 audit plan marks the agent-teams primitive dormant. The primitive has no execution runtime on the dev line — `team spawn` is a readiness *checker*, not a dispatcher, and no command/skill/workflow runs a team — yet the 4 demo teams were installed to `.claude/teams/` as if runnable, and `team spawn` offered to scaffold missing member-agent files directly into `.claude/agents/` (a self-mod foot-gun bypassing the Write/Edit guard). This ship decommissions the installs (keeping the teams as reference examples), disables the scaffold, documents the disposition, and pins it with a drift-guard. The validated CLI is unchanged.

## What shipped

- **Decommission:** removed the 4 team standalone install entries from `project-claude/manifest.json` and deleted the `project-claude/teams/` source — a fresh install no longer populates `.claude/teams/`. The 4 teams stay as reference examples in `examples/teams/<category>/` (the v1.49.970 catalog) with a "Dormant — reference example only" banner.
- **Scaffold disabled:** removed `offerInteractiveFix` + the `writeTeamAgentFiles` import from `team-spawn.ts`; spawn now validates and reports missing agents only, never writes. Readiness check (`validateMemberAgents`) kept; docstrings/help updated.
- **Docs:** new `docs/AGENT-TEAMS-DORMANT.md` (what works, capability-based resume condition, dated review gate) + a banner in `docs/AGENT-TEAMS.md`.
- **Drift-guard:** `tests/integration/agent-teams-dormant.test.ts` pins decommission + scaffold-disable + banner (Layer-1 vitest — no new pre-tag-gate shell step).
- `team create` scaffolding intentionally left (explicit user action; scope per #10409).

## Verification

- Drift-guard 5/5; `tsc` clean; `src/teams/` + CLI suites 1128 pass; `install.cjs --dry-run` clean (no team refs).
- Pre-tag-gate all 20 PASS (one perf-assertion flake, confirmed flaky in isolation, green on re-run); CI green on dev.
- Adversarial pre-push review: **1 MAJOR fixed in code** (stale `teamSpawnCommand` JSDoc); dashboard finding correctly refuted.

## Engine state

NASA degree **1.178** (frozen) · counter-cadence **29** (unchanged) · manifest lessons **151** (unchanged).
