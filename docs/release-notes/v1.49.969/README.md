---
title: "v1.49.969 — ME-2 model-affinity dispatch actuator"
version: v1.49.969
date: 2026-06-04
summary: >
  Ship 1.2 of the 2026-06-03 audit plan turns ME-2's previously-dead
  `escalateTo` advisory into a live actuator: a new pure resolver maps a
  dispatched agent's bundled-skill model-affinity decisions into the strongest
  model tier, and AgentGenerator raises the generated agent's `model:`
  frontmatter to it — gated behind the existing `model_affinity.enabled` flag,
  default-off, byte-identical when off.
tags: [model-affinity, me-2, actuator, dispatch, default-off]
---

# v1.49.969 — ME-2 model-affinity dispatch actuator

**Shipped:** 2026-06-04

ME-2 already computed which model a skill needs but nothing consumed the answer; this ship wires that escalation into the model a dispatched agent is actually spawned with.

## Why this ship

Ship 1.2 ⭐ of the 2026-06-03 audit plan (Phase 1, the "harness dividend"). The ME-2 module computed `AffinityDecision.escalateTo` ("this skill is unreliable on the current model — upgrade to X") but the value was **dead in production**: only the CLI and one flag-off test consumed it, and the M5-selector docstring claim was aspirational. The audit flagged turning that advisory into a real actuator as a high-leverage, low-risk move. Scope was held to the one site with a genuine *skill → dispatched-agent* link — `AgentGenerator`, which bundles a cluster of skills into an agent definition with a `model:` field. The in-context M5 selector is deliberately left untouched (the current session's model cannot change mid-flight).

## What shipped

- **New pure resolver** `src/model-affinity/actuator.ts` — `resolveDispatchModel(decisions, baseModel, featureEnabled)`. Flag-off (`featureEnabled = false`) is a byte-identical no-op that ignores the decisions entirely (CF-ME2-01). When on, it picks the strongest `escalateTo` strictly above the base tier; `inherit` (tier −1) is replaced by any concrete escalation; `unknown`/undefined targets are guarded out. It reports `from`/`to`/`drivers` for audit.
- **AgentGenerator wire** `src/agents/agent-generator.ts` — an optional `modelAffinity` config block (`{ enabled, decisions? }`); `resolveEffectiveModel` threads the resolved model into **both** frontmatter sites (the `formatAgentMarkdown` template and the validation `frontmatterData`). Absent or `enabled: false` → the generated agent's `model:` is exactly `config.model`, byte-identical to the pre-ME2 baseline.
- **Flag bridge** — gated by the existing `gsd-skill-creator.model_affinity.enabled` flag (default-off). The resolver stays pure and takes the boolean directly; callers bridge via `readModelAffinityEnabledFlag()`.
- **Barrel export** — `resolveDispatchModel` + `DispatchModel`/`DispatchModelResolution` from `src/model-affinity/index.ts`.

## Verification

- `tsc -p tsconfig.json --noEmit` clean (two real type errors in the new code were caught and fixed: an unreachable `inherit` comparison and a `ModelFamily`-typed test index).
- 54 tests green across three suites with no regression: the new pure-resolver unit suite (flag-off no-op, tier selection, ties, `inherit` replacement, defensive guards, an exhaustive base × target matrix), the new real-`AgentGenerator`↔actuator integration wire test (model escalated when on; generated content byte-identical when off; on-disk `create()` reflects the escalation), and the pre-existing `agent-generator` suite.
- Step-P adversarial review (five read-only lenses → adversarial verify): **0 confirmed findings against the ship code**; the single confirmed MINOR was pre-existing STORY.md DB-regen drift, out of scope and not committed by this ship.
- Full pre-tag-gate (all 20 checks) PASS.

## Engine state

- **NASA degree:** 1.178 (frozen — pressure-margin hold, unchanged).
- **Counter-cadence count:** 29 (unchanged — normal forward `feat`, not a counter-cadence ship).
- **Manifest lesson count:** 151 (unchanged — applies existing disciplines; no new manifest lesson).
