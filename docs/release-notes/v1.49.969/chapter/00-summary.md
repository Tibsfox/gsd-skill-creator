# v1.49.969 — Summary

## The ship

Ship 1.2 ⭐ of the 2026-06-03 audit plan turns ME-2's previously-dead `AffinityDecision.escalateTo` advisory into a live actuator. ME-2 already computed which model a skill needs to run reliably, but nothing in production consumed the answer (only the CLI and one flag-off test). This ship adds a pure resolver that maps a dispatched agent's bundled-skill escalation decisions into the strongest model tier, and wires it into `AgentGenerator` so the generated agent's `model:` frontmatter is raised accordingly — gated behind the existing `model_affinity.enabled` flag, default-off, byte-identical when off.

## What shipped

- **`src/model-affinity/actuator.ts` (new):** `resolveDispatchModel(decisions, baseModel, featureEnabled)`. Flag-off is a byte-identical no-op (CF-ME2-01); when on, picks the strongest `escalateTo` strictly above the base tier, replaces `inherit` (tier −1) with any concrete escalation, guards out `unknown`/undefined targets, and reports `from`/`to`/`drivers`.
- **`src/agents/agent-generator.ts`:** optional `modelAffinity` config block; `resolveEffectiveModel` threads the resolved model into both frontmatter sites. Absent or `enabled: false` → `model:` equals `config.model` exactly.
- **`src/model-affinity/index.ts`:** exports `resolveDispatchModel` + `DispatchModel`/`DispatchModelResolution`.
- The in-context M5 selector is left untouched — dispatched agents only.

## Verification

- `tsc --noEmit` clean; 54 tests green across the new actuator unit suite, the new integration wire test, and the pre-existing `agent-generator` suite (no regression).
- Step-P adversarial review (five lenses → verify): 0 confirmed findings against the ship code.
- Full pre-tag-gate (all 20 checks) PASS.

## Engine state

- NASA degree **1.178** (frozen). Counter-cadence **29** (unchanged). Manifest lesson count **151** (unchanged).
