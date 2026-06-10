---
title: "Context"
chapter: 99-context
version: v1.49.1028
date: 2026-06-10
summary: "Where v1.49.1028 sits in the larger arc."
tags: [context, deploy-layer, audit-ship-2]
---

# v1.49.1028 — Context

## Milestone metadata

- **Version:** v1.49.1028
- **Type:** `fix(install)` — Deploy-Layer Fix: Targeted Install, Parity Drift-Guard, Activation Counter
- **Predecessor:** v1.49.1027 (Loop-Outcome Ship; sha `780de18a4`)
- **NASA degree:** 1.217 (unchanged — code ship)
- **Counter-cadence count:** 29 (unchanged)

## Where this sits

Second ship of the AUDIT-2026-06-09 §10 next-5 sequence, directly behind the v1.49.1027 loop-outcome
ship. It discharges the audit's §3.2 MAJOR (deploy layer unobserved — the #10461 class at the
source↔installed boundary) and the C5 follow-on (`.skill-index.json` empty since 2026-02-12, 4th
consecutive audit flag, correctly sequenced AFTER the deploy fix because undeployed wires can produce no
activations). With the 4 v974 research-skill wires now actually deployed and the activation counter
landing real corpus numbers, the v1027 co-activation widening and this ship form a connected
measurement chain: widened mining → live wires → durable per-skill index. Remaining §10 queue:
ship 3 (WARN→BLOCK promotions + ship-review v2), ship 4 (Rust ACL reconciliation, 92 orphans),
ship 5 (tools/workflows/ library + NASA discipline-doc refresh).

## Files changed

Commit `4d3080296` (fix install): project-claude/install.cjs.
Commit `989e5cb35` (test): tests/integration/install-parity.test.ts.
Commit `1c724e07a` (feat): src/storage/skill-index.ts, src/cli/commands/activations.ts (new),
src/cli/dispatch.ts, src/storage/skill-index.test.ts (new), src/cli/commands/activations.test.ts (new),
docs/CLI.md.
Commit `a7b11758a` (fix): src/validation/skill-validation.ts, src/storage/skill-index.ts,
src/cli/commands/activations.ts, src/validation/backward-compat.test.ts, + test additions.
Commit `b8df6c3b2` (fix skills): project-claude/skills/{image-to-mission,team-control}/SKILL.md.
Commit `16cfaef3a` (docs, review MAJOR): src/validation/{skill-validation.ts,backward-compat.test.ts}.
Working-tree (gitignored, deliberate): 13 files under .claude/ (11 deploys + 2 YAML-repair redeploys),
.claude/skills/.skill-index.json (populated).
Release docs: docs/release-notes/v1.49.1028/** (this set).

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 (atomic directive state) + Lesson #10184 (single-step main FF) + Lesson #10197
(STORY-gate post-bump-version). Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- Step P ran as Workflow `wf_1dc557b5-3ca` with `base: "v1.49.1027"` (5 lenses, 6 agents); 1 MAJOR
  confirmed → fixed pre-push (`16cfaef3a`).
- The deploy itself is a working-tree operation (`.claude/` gitignored); the committed artifacts are the
  installer fix, the drift-guard, the counter, and the source repairs.

## Engine state at close

NASA degree **1.217**, counter-cadence **29**, manifest lessons **152**, calibratable thresholds **8** —
all unchanged (code ship). `.skill-index.json`: entries 0 → 37, skills with activation counts 0 → 5.
cadence_advances: [consume, verify].
