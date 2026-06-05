---
title: "v1.49.978 — reachability shelfware disposition"
version: v1.49.978
date: 2026-06-05
summary: >
  Ship 3.2 closes the reachability-only shelfware loop opened by Ship 3.1: the 16
  non-allowlisted living-but-unreachable modules each get a WIRE/ALLOWLIST/RETIRE
  verdict, and the 180-ship-stale upstream/upstream-intelligence triage is finally
  resolved. After this ship the adoption baseline's "Living but unreachable from
  production" section holds zero non-allowlisted rows.
tags: [phase-3, adoption, shelfware, disposition, reachability]
---

# v1.49.978 — reachability shelfware disposition

**Shipped:** 2026-06-05

Every reachability-only shelfware candidate Ship 3.1 surfaced is now disposed: 2 wired into the shipped CLI, 14 allowlisted with dated review gates, and the long-orphaned `upstream` pair retired.

## Why this ship

Ship 3.1's reachability-v2 dimension found **16** modules that read `living` by import-surface but were unreachable from any shipped entry point — a class of shelfware the import-surface scanner missed. Ship 3.2 verdicts each one (the lightest-wire CLI-subcommand pattern proven by the v789–793 Math-Foundations cluster) and actions the `upstream`/`upstream-intelligence` legacy pair that had sat allowlisted-but-pending-triage since v786 (~180 ships). A 4-agent recon + adversarial-verify workflow classified every module; the disagreements (cache, components, skill, scan-arxiv, amiga) were adjudicated against live code before any irreversible action, and two "clean-leaf" retires (health-diagnostician, components) were downgraded to allowlist once their couplings surfaced.

## What shipped

- **WIRE (2):** `git` — a new `src/cli/commands/git.ts` router surfaces the authored-but-unwired `registerGitCommands()` as `skill-creator git <sub>` (install/status/sync/work/gate merge|pr/worktree list), routed under `git` to avoid colliding with the existing `install` skill-installer; `skill` — registered `skillInventoryCommand` as `skill-creator skill-inventory`/`inventory`/`inv`. Both modules now reachable from `src/cli.ts`.
- **ALLOWLIST (14):** amiga, audio-engineering, bayes-ab, cache, commands, components, dependency-auditor (wired Egress/ProcessContext security chokepoints), engines, health-diagnostician, learn, scan-arxiv, skill-isotropy, skill-promotion, umwelt — each with a dated **2027-06-05** retire-or-resume gate.
- **RETIRE (2):** `upstream` (2,039-LOC orphan agent pipeline, 0 importers) + `upstream-intelligence` (91-line Gate-G14 composition barrel). Deleted both dirs + the external `tests/upstream/` suite (52 files); the `gsd-skill-creator.upstream-intelligence.*` config namespace read by 10 living modules is preserved.
- **Docs + guard:** 18 verdict rows in `docs/SHELFWARE-VERDICTS.md`; a Ship 3.2 drift-guard block in `tests/integration/learning-substrate-parked.test.ts` pinning the empty-non-allowlisted invariant, git/skill reachability, the retires, and namespace survival.

## Verification

- Full root suite **34,571 passed** / 0 failures (post-retire count; the upstream suites were removed).
- Pre-tag-gate **all 20 checks PASS**; the new drift-guard lands in an existing suite, so the gate denominator stays 20.
- `npx tsc --noEmit` clean; both new commands smoke-tested (`git --help`, `skill-inventory`).
- Live adoption scan confirms the headline: **0 non-allowlisted** living-but-unreachable rows; `git`/`skill` `reachableFromProduction:true`; `upstream`/`upstream-intelligence` gone. INVENTORY-MANIFEST `src_subsystems` 153→151.
- Step-P adversarial review (5 dimensions): **0 confirmed findings**.

## Engine state

NASA degree **1.178** (frozen) · counter-cadence **29** · manifest lessons **152** — all unchanged (forward audit-plan ship, no new lesson promoted). No `cadence_advances`.
