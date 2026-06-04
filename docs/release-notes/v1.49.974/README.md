---
title: "v1.49.974 — skills source-of-truth promotion + research-skill wires"
version: v1.49.974
date: 2026-06-04
summary: >
  Ship 2.2 from the 2026-06-03 audit plan: close the clean-install
  reproducibility gap for the skills tier and disposition the 4 arxiv research
  skills ("wire all 4"). Seven skills that lived only in the gitignored
  .claude/skills/ tree were promoted into project-claude/skills/ (installed via
  manifest autoDiscover); the 4 research skills were each wired into their
  semantically-correct documented consumer; uc-observatory stays KEEP-LOCAL per
  D1. A drift-guard pins the promotions, the KEEP-LOCAL boundary, and every wire.
  No runtime/src behavior change.
tags: [skills, source-of-truth, research, wire, ship-2.2, drift-guard]
---

# v1.49.974 — skills source-of-truth promotion + research-skill wires

**Shipped:** 2026-06-04

Skills that existed only in the installed `.claude/skills/` tree are now reproducible from `project-claude/skills/`, and the four arxiv research skills each have a real caller.

## Why this ship

Ship 2.2 of the 2026-06-03 core-functions audit plan. The skills tier had a clean-install reproducibility gap: 8 skills were present in the gitignored installed `.claude/skills/` tree but not in the `project-claude/skills/` source-of-truth, so `node project-claude/install.cjs` on a fresh checkout would not reproduce them. The 4 arxiv-paper-backed research skills were also caller-less shelfware. The operator chose **"wire all 4"** for the research disposition.

## What shipped

- **Promoted 7 skills** into `project-claude/skills/` (single-file skills install via the `manifest.json` schema-v2 `autoDiscover` glob — no explicit manifest entry needed): keepers `adversarial-pr-review`, `image-to-mission`, `token-budget`; arxiv research `execution-grounded-selection`, `intent-router`, `skill-counterfactual-audit`, `spectral-topology-preflight`. `install.cjs --dry-run` reports 0 new. The 3 keepers' frontmatter was brought to the CF-H-032 source-of-truth spec (`status: ACTIVE` + a `triggers` list).
- **Wired each research skill into its semantically-correct documented consumer:**
  - `skill-counterfactual-audit` → the `skill-integration` skill (skill-lifecycle audit gate). **Not** the Gastown `done-retirement` pipeline its own doc named — `done-retirement` retires polecat *work-items*, not skills.
  - `spectral-topology-preflight` → the `team-control` skill (team pre-flight topology check before launching the four-agent team).
  - `intent-router` → the `wrap:execute` + `wrap:verify` commands (first step in handler dispatch).
  - `execution-grounded-selection` → the `wrap:verify` command (disambiguate multiple candidate fixes by behavioural fingerprint vs output-majority voting).
  All wires are advisory / best-effort — a missing companion skill never blocks the host command.
- **`uc-observatory` KEEP-LOCAL** per decision-gate D1 (coupled to the parked v1.50 / Unit-Circle work); a drift-guard pins the exclusion so it is a decision, not drift.
- **`docs/skills-source-of-truth.md`** (committed inventory + the skills-tier adoption answer; a richer per-skill activation counter extending `src/storage/skill-index.ts` is noted as a scoped follow-on) + **`tests/integration/skills-source-of-truth.test.ts`** drift-guard (Layer-1 vitest, no new gate step) pinning the promoted set, the KEEP-LOCAL boundary, and every wire — mutation-proven.

## Verification

- Drift-guard 15/15; agentskills-spec-compliance + c12-skill-structure + skill-schema + gastown (430+) green; `tsc --noEmit` clean; `install.cjs --dry-run` 0 new.
- Pre-tag-gate: all 20 checks PASS.
- **CI on dev caught one real regression before main:** promoting `adversarial-pr-review` into source-of-truth brought its body under the harness-integrity security scanner, which flagged the guardrail line "must not bypass security-hygiene checks" as a privilege-escalation pattern (`bypass\s+security`). Reworded to "must not circumvent …" — a guardrail phrase must not contain the literal it guards (#10462).
- Adversarial pre-push review (5 lenses → adversarial verify): **0 confirmed findings** (2 refuted: the forward-dated v974 docs and the "9 UC-lab agents" count were both correct).

## Engine state

NASA degree **1.178** (frozen) · counter-cadence **29** (unchanged — forward audit-plan ship) · manifest lessons **152** (unchanged — no new lesson codified this ship).
