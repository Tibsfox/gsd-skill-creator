---
title: "v1.49.976 — team schema reconcile + chipset taxonomy/validate fixes"
version: v1.49.976
date: 2026-06-04
summary: >
  Ship 2.4 (Phase-2 surface hygiene) from the 2026-06-03 audit plan: migrate
  the 2 legacy-dialect example team configs so `team validate --all` is 4/4
  clean, align the chipset-taxonomy doc with the real 9-kind schema union, and
  teach `cartridge validate` to accept research-output cartridges.
tags: [ship-2.4, surface-hygiene, cartridge, teams, chipset-taxonomy]
---

# v1.49.976 — team schema reconcile + chipset taxonomy/validate fixes

**Shipped:** 2026-06-04

Closed the four remaining Ship 2.4 drift items: the two legacy-dialect demo
team configs now validate, the chipset-taxonomy doc matches the schema union,
and `cartridge validate` no longer throws on the five research-output cartridges.

## Why this ship

Ship 2.4 was the last open item in the 2026-06-03 audit plan's Phase 2 (surface
hygiene). Recon refuted the handoff's "teams mostly closed" framing — D2/v971
finished the dormancy/decommission work, but `team validate --all` still
reported **2/4 FAIL** because `code-review-team` and `doc-generation-team` were
authored in a pre-schema dialect (`role`/`description`, no `agentId`). The plan's
chipset premises were also imprecise: the taxonomy doc didn't "list 11", it
listed the wrong 9 (it had `muse`/`forge`, which are not schema kinds, and
omitted `voice`/`metrics`, which are). Operator chose **migrate + drift-guard**
for the teams fork.

## What shipped

- **Teams (migrate + drift-guard).** Mechanically migrated the 2 legacy-dialect
  example team configs to the current team schema (`agentId` from name,
  `agentType` from leader/worker → coordinator/specialist, `prompt` from
  description, plus `leadAgentId`/`createdAt`/`version`). `team validate --all`
  now reports **4/4 PASS** with no schema-dialect drift. Added a SCHEMA PARITY
  assertion to `tests/integration/agent-teams-dormant.test.ts` that validates
  all 4 example `config.json` via `validateTeamConfig` + `validateTopologyRules`
  — closing the gap where the guard checked only the README banner text.
- **Chipset taxonomy doc.** `docs/cartridge/CHIPSET-TAXONOMY.md` listed `muse`
  and `forge` (not in the `ChipsetSchema` union) and omitted `voice` and
  `metrics` (in the union, used by the `space-between` and `cartridge-forge`
  cartridges). Replaced the `muse`/`forge` sections with `voice`/`metrics` so
  the doc's nine kinds match the schema union exactly.
- **types.ts comment.** `// …discriminated union over 8 functional roles` → 9
  (the union has 9 members).
- **cartridge validate.** `handleValidate` used `loadCartridge`, which throws
  for research-output cartridges. Switched to `loadAnyCartridge` and dispatch on
  `isResearchOutputCartridge` → `validateResearchOutputCartridge`. The 5
  research-output example cartridges now validate via the CLI. New `CL-16` test.

## Verification

- `tsc` clean; targeted suites 47/47; ProcessContext audit 2056/2056.
- Live `team validate --all` → **4/4 PASS** (0 errors each).
- All **63** example cartridges validate via the CLI (research-output **5/5**;
  the pre-existing department known-debt set via `--allow-validation-debt`,
  unchanged), 0 regressions; cartridge.ts diff is a tight +10/-4 dispatch swap.
- Drift-guard proven non-vacuous: `validateTeamConfig` rejects the old dialect
  on exactly `leadAgentId`/`createdAt`/`agentId`.
- step-P adversarial review (5 lenses) **0 confirmed, 0 refuted**.
- pre-tag-gate **all 20 PASS**; CI green on `ff3cca217`. (One unrelated flake on
  the `src/cache` preload latency-ratio test under full-suite load — passes
  10/10 ×3 in isolation; re-ran the gate clean.)

## Engine state

NASA **1.178** (frozen) · counter-cadence **29** · manifest **152** — all
unchanged (forward audit-plan ship, no new lesson, no cadence advance).
