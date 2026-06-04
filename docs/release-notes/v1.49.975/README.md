---
title: "v1.49.975 — agent adoption scan + dormant-agent verdicts"
version: v1.49.975
date: 2026-06-04
summary: >
  Ship 2.3 from the 2026-06-03 audit plan: give the agent tier the adoption
  telemetry src/ modules already have, and disposition the genuinely-dormant
  agents. A new agent-adoption scanner (the sibling of tools/adoption-scan.mjs)
  classifies the 48 source agents living/test-only/dormant by grepping scripted
  dispatch sites. The plan's premise — relocate gsd-orchestrator + 3 "frozen"
  agents to examples/ — was REFUTED: all four are description-dispatched and
  load-bearing, so no agent is relocated. The 7 non-scripted agents are
  allowlisted with per-agent verdicts; the one true orphan (gsd-intel-updater)
  is parked with a dated retire-or-resume gate. No runtime/src behavior change.
tags: [agents, adoption, telemetry, drift-guard, ship-2.3]
---

# v1.49.975 — agent adoption scan + dormant-agent verdicts

**Shipped:** 2026-06-04

The agent tier now has the same adoption telemetry the `src/` tier has had since v786 — and the audit's "retire the dormant agents" list turned out, on inspection, to be load-bearing.

## Why this ship

Ship 2.3 of the 2026-06-03 core-functions audit plan. `src/` modules have adoption telemetry (`tools/adoption-scan.mjs`); the agent tier had none, so the project could not distinguish a dispatched agent from vestigial shelfware. The plan also proposed relocating `gsd-orchestrator`, `doc-linter`, `codebase-navigator`, and `changelog-generator` to `examples/` as "frozen/vestigial."

A 5-agent recon **refuted that premise** on verified grounds: those four are **description-dispatched** (invoked by Claude Code on their `description` frontmatter, not a scripted `subagent_type=`) and **load-bearing** — relocating them would break `render-claude-md.mjs` classifyAgents (pre-tag-gate step 7), drift `INVENTORY-MANIFEST.json`, and make `install.cjs` exit 1 on their standalone manifest entries. The operator chose **scanner + allowlist + verdicts (no relocation)**, and **park `gsd-intel-updater`** (the one genuine orphan) with a dated triage gate.

## What shipped

- **`tools/agent-adoption-scan.mjs`** — the agent-tier sibling of `adoption-scan.mjs`. Enumerates the source-of-truth agents (`project-claude/agents/`, 48) and greps the installed dispatch corpus (GSD workflows + templates, slash-commands, skills, teams) for whole-token mentions, classifying each agent `living` / `test-only` / `dormant`. Mirrors the src/ scanner's conventions: `--json`, `--dormant-threshold N`, `--allowlist`, `--no-allowlist`, `--root`, `--agents-dir`, `exitWhenDrained`. Snapshot: **41 living · 0 test-only · 7 dormant.**
- **`tools/agent-adoption-scan.allowlist.json`** — 7 exemptions, each with a reason: 4 **description-dispatched** load-bearing agents (`gsd-orchestrator`, `doc-linter`, `codebase-navigator`, `changelog-generator`); 2 **script-twins** (`pipeline-reconciler`, `quality-drift-watcher` — the work runs as `tools/release-history/*.mjs`, the `.md` is the spec twin); and the one **orphan** `gsd-intel-updater`, parked with a dated 2027-06-04 retire-or-resume triage gate.
- **`docs/AGENT-ADOPTION-VERDICTS.md`** — the decision surface (per-agent disposition + the D1 boundary), kept separate from the scanner's observability surface. **`docs/AGENT-ADOPTION-BASELINE.json`** — the committed point-in-time snapshot.
- **`skill-creator agents adoption`** — a thin CLI wrapper over the scanner (routed through the `ProcessContext` chokepoint); help text in `agents.ts` + `help.ts`.
- **Two CI-safe drift-guards** (Layer-1 vitest, no new pre-tag-gate shell step → gate stays 20): `tools/__tests__/agent-adoption-scan.test.mjs` (scan logic on synthetic fixtures, added to `vitest.tools.config.mjs`) and `tests/integration/agent-adoption-allowlist-parity.test.ts` (allowlist↔source integrity, the **no-un-allowlisted-dormant** invariant, baseline freshness, the dated gate, and verdict-doc coverage).

The **9 UC-lab agents** stay LIVING-via-spawn-site (`team-control` + `uc-observatory`), honoring D1; the 3 `v1.50a-*` paused agents are out of source-of-truth adoption scope.

## Verification

- Scanner: 48 agents, 41 living / 7 dormant, **0 un-allowlisted dormant**; `--no-allowlist` correctly fails listing exactly the 7. Tool test 11/11; integration drift-guard 9/9; `tsc` clean; pre-tag-gate **all 20 PASS**.
- **CI on dev caught one real regression before main:** the new `skill-creator agents adoption` wrapper imports `child_process`, which trips the `ProcessContext` chokepoint security audit (`src/security/process-context-audit.test.ts`) — any `child_process` caller must route through `ensureProcessAllowed()`. Fixed by threading the chokepoint exactly as `keystore.ts`/`terminal.ts` do, then amended.
- Adversarial pre-push review (5 lenses → adversarial verify, 6 agents): **0 confirmed findings** (1 refuted: the forward-dated v975 version reference is standard pre-ship practice).

## Engine state

NASA degree **1.178** (frozen) · counter-cadence **29** (unchanged — forward audit-plan ship) · manifest lessons **152** (unchanged — no new lesson codified this ship).
