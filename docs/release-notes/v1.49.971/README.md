---
title: "v1.49.971 — mark agent-teams primitive dormant (D2)"
version: v1.49.971
date: 2026-06-04
summary: >
  D2 execution from the 2026-06-03 audit plan: the agent-teams primitive has no
  execution runtime on the dev line (no `team run`; `team spawn` is a readiness
  checker), so the 4 demo teams presented as installed-but-unrunnable and
  `team spawn` carried a self-mod foot-gun. This ship marks the primitive
  dormant — decommissions the demo-team installs (kept as reference examples),
  disables the spawn scaffold, documents the disposition, and pins it with a
  drift-guard. The validated CLI is unchanged.
tags: [teams, dormant, decommission, self-mod, drift-guard, D2]
---

# v1.49.971 — mark agent-teams primitive dormant (D2)

**Shipped:** 2026-06-04

The agent-teams primitive can validate and inspect team configs but cannot run them (no `team run` verb on the dev line); v1.49.971 marks it dormant so the 4 demo teams stop presenting as runnable installs and `team spawn` stops scaffolding agent files.

## Why this ship

D2 of the 2026-06-03 core-functions audit plan (settled 2026-06-03). The audit confirmed the primitive is dormant on the dev line: `team spawn` is a readiness *checker* (no dispatcher), the rich-schema teams carry unresolved member agentIds, and zero command/skill/workflow wires a team. Yet the 4 demo teams (`code-review-team`, `doc-generation-team`, `gsd-debug-team`, `gsd-research-team`) were installed to `.claude/teams/` via `manifest.json` — presenting as runnable when nothing can run them — and `team spawn` *offered to generate* missing member agent files, writing `.md` into `.claude/agents/` via `fs.writeFileSync` (bypassing the Write/Edit self-mod guard). Two real problems: a misleading install surface and a self-mod foot-gun.

**Premise shift (operator-approved).** The settled D2 said "relocate the 4 demo teams to a NEW `examples/dormant-teams/` dir (NOT `examples/teams/`, whose tooling drops 88%)." That rationale was invalidated the day after D2 was settled — v1.49.970 de-hardcoded the `examples/` catalog tooling, so `examples/teams/` now serves its full tree, and the 4 teams already live there (cataloged). A separate `dormant-teams/` tree would re-introduce the catalog-invisible artifacts v970 removed. Operator chose (2026-06-04) "decommission install, mark in place" instead.

## What shipped

- **Decommissioned the demo-team installs:** removed the 4 team standalone entries from `project-claude/manifest.json` and deleted the `project-claude/teams/` source, so a fresh `install.cjs` no longer populates `.claude/teams/`. The 4 teams remain as reference examples under `examples/teams/<category>/` (the v1.49.970 catalog), each with a "Dormant — reference example only" README banner.
- **Disabled the `team-spawn` scaffold foot-gun:** removed `offerInteractiveFix` (and its `writeTeamAgentFiles` import). `team spawn` now validates and *reports* missing member agents only — it never writes. The readiness check (`validateMemberAgents`) is kept; the file/help/JSDoc docstrings were updated to match.
- **Documented the disposition:** new `docs/AGENT-TEAMS-DORMANT.md` (what still works, the capability-based resume condition, a dated retire-or-resume review gate) + a banner in `docs/AGENT-TEAMS.md`.
- **Drift-guard:** `tests/integration/agent-teams-dormant.test.ts` pins the decommission (manifest installs zero teams; source removed), the scaffold-disable (no `offerInteractiveFix`/`writeTeamAgentFiles`; readiness check kept), and the banner — a Layer-1 vitest test, so no new pre-tag-gate shell step / denominator bump.

The validated CLI (`create`/`list`/`validate`/`estimate`/`status`) is unchanged. `team create` scaffolding is intentionally left intact (explicit, solicited user action — distinct from the spawn check's unsolicited write; scope per lesson #10409).

## Verification

- New drift-guard: 5 tests, all pass. `tsc --noEmit` clean. Full `src/teams/` + CLI suites: 1128 pass.
- `node project-claude/install.cjs --dry-run`: no team-related warning or missing-source error (the 4 teams are simply absent).
- Pre-tag-gate: all 20 checks PASS (one `m2-short-term` perf-assertion flake under concurrent load, confirmed flaky in isolation, green on re-run). CI green on dev.
- Adversarial pre-push review (5 lenses → adversarial verify): **1 MAJOR confirmed and fixed in code** — a stale `teamSpawnCommand` JSDoc still claiming it "Offers to generate missing agent files interactively"; the dashboard out-of-scope finding was correctly refuted (not in the commit).

## Engine state

- **NASA degree:** 1.178 (frozen — unchanged)
- **Counter-cadence count:** 29 (unchanged — forward audit-plan ship, not counter-cadence)
- **Manifest lesson count:** 151 (unchanged — applies existing lessons #10409 scope-discipline + #10461 gate-enforce/drift-guard pairing; no new promotion)
