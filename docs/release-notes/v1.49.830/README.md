> Following v1.49.829 — _T1.3 Application-Boundary Wire (Cross-Rootdir Integration Test)_, v1.49.830 opens the T1.3 Option C arc by declaring the `ConceptFallbackProvider` cross-rootdir interface in `src/predictive-skill-loader/fallback.ts`, threading a `lowConfidenceThreshold` setting through the predictor result, and wiring an optional `fallbackProvider` field into the 1st production caller (`src/chipset/copper/activation.ts`). Implementation in `.college/integration/` is deferred to v831; the 2nd production caller (selector) + tests/integration/ wire is deferred to v832. Framework-only ship — no .college/ touched, no production behavior change when `fallbackProvider` is unset.

# v1.49.830 — T1.3 Option C Framework (ConceptFallbackProvider Interface + Threshold Setting + Copper Wire)

**Shipped:** 2026-05-27

Opens the T1.3 Option C arc (low-confidence fallback to RosettaCore for cross-domain analogy). v830 ships the FRAMEWORK only: a duck-typed cross-rootdir interface declared in src/, a threshold setting (default 0.30), and an optional fallback hook on copper's `ActivationContext`. The implementation that satisfies the interface lives in `.college/integration/` (v831); the 2nd production caller + integration test arrive in v832.

## Why this ship

Per the v829 handoff: "T1.3 Option C — RosettaCore confidence-bound fallback (~2-3 ships)" is the largest open branch of T1.3 GAP-2. Recon at v829 confirmed:

- Both `src/chipset/copper/activation.ts` and `src/orchestration/selector.ts` invoke `predictNextSkills(currentSkill, {})` and ignore the score (no consumer of confidence).
- A "low-confidence trigger" naturally lives AFTER predictions arrive in both call sites.
- The implementation (RosettaCore + ConceptRegistry) lives in `.college/rosetta-core/`, which `src/` cannot import directly per the established rootdir boundary.

The clean partition: declare the contract in src/, satisfy it from .college/ via duck typing — the same shape as v823's `SkillActivationObserver` ↔ `ObservationBridge` wire. This is the 3rd instance of that pattern after v823 (declaration) + v829 (verification).

## What shipped

- **NEW** `src/predictive-skill-loader/fallback.ts` (~45 LOC):
  - `ConceptSuggestion` — primitive-field record (`conceptId`, `rendered`, `domain?`, `via`) carrying no .college/ types.
  - `ConceptFallbackProvider` — interface with `onLowConfidence(currentSkill, maxScore): Promise<ConceptSuggestion[] | null>`.
- **MODIFIED** `src/predictive-skill-loader/settings.ts` (~6 LOC):
  - Adds `lowConfidenceThreshold: number` field to `PredictiveSkillLoaderConfig` (default 0.30).
  - Reader parses the field from `.claude/gsd-skill-creator.json` via `asNumber` with the same fail-closed pattern as `topK`/`hops`/`decay`.
- **MODIFIED** `src/predictive-skill-loader/index.ts` (~15 LOC):
  - Re-exports `ConceptFallbackProvider` + `ConceptSuggestion` from `./fallback.js`.
  - Adds `lowConfidenceThreshold: number` to `PredictionResult` so callers don't pay a second settings read on the hot path.
  - Both code paths in `predictNextSkillsWithMeta` (disabled + enabled) populate the field.
- **MODIFIED** `src/chipset/copper/activation.ts` (~40 LOC):
  - Adds optional `fallbackProvider?: ConceptFallbackProvider` field to `ActivationContext`.
  - Switches `emitPredictions` from `predictNextSkills` → `predictNextSkillsWithMeta` to access the threshold.
  - When `fallbackProvider` is wired, computes `maxScore = predictions.length === 0 ? 0 : Math.max(...predictions.map(p => p.score))` and invokes `onLowConfidence(currentSkill, maxScore)` if `maxScore < lowConfidenceThreshold`.
  - Subscriber-gated at the same two layers as `onPredictions`: skips the entire pipeline when neither `onPredictions` nor `fallbackProvider` is set.
  - Errors from any layer remain swallowed (fire-and-forget contract preserved).
- **MODIFIED** `src/chipset/copper/activation.test.ts` (+119 LOC, 4 new tests):
  - Fires the fallback when only `fallbackProvider` is wired (no `onPredictions`).
  - Fires BOTH `onPredictions` and fallback when both wired and max-score below threshold.
  - Does NOT fire when neither is wired.
  - Activation survives a throwing fallback (fire-and-forget contract).
- **MODIFIED** `src/predictive-skill-loader/__tests__/integration.test.ts` (4 lines): adds `lowConfidenceThreshold: 0.30` to inline config objects (the field is now required by `PredictiveSkillLoaderConfig`).
- **MODIFIED** `src/predictive-skill-loader/__tests__/orchestration-byte-identical.test.ts` (1 line): same field addition.
- **MODIFIED** `.planning/PROJECT.md` — pre-bump refresh v829 → v830.

`src/orchestration/selector.ts` is NOT touched in this ship — selector is the 2nd production caller and arrives in v832 (mirrors copper).

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `src/chipset/copper/activation.test.ts` | +4 | New `fallbackProvider` describe-block |
| `src/predictive-skill-loader/__tests__/*.ts` | 0 (changes only) | Inline config objects updated to include the new required field |
| Full suite | 35,217+ | +4 net |
| **LOC delta** | ~225 (src) / ~125 (test) | 1 new src/ file; 5 src/ + test/ files modified |

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **48 consecutive ships at 1.178**). Counter-cadence count UNCHANGED at 6.

Manifest entries: **22 → 22** (UNCHANGED — framework ship; no new lessons codified).
Open lesson candidate backlog: **0** (UNCHANGED).
Tentative observations carried forward:
- Cross-rootdir wire pattern now at **3 instances** (v823 declaration + v829 verification + v830 framework). #10426 codification threshold MET 2 ships ago; v830 reinforces.
- `onPredictions` substrate-consumer wire pattern still at 2 instances (v810 + v826). Eligible.
- `#10433` LOC-band-by-callsite-count refinement still at 3 instances (v825 + v827 + v828). Eligible.
- NEW: **Substrate-consumer hook PAIR pattern** — `onPredictions` + `fallbackProvider` co-located on the same context, both fire-and-forget, both subscriber-gated. 1st instance.

Wired calibratable thresholds: **5 of 6 → 6 of 6** (NEW: `lowConfidenceThreshold` is registered as a settings-tunable threshold). The bounded-learning calibration loop can now schedule a calibration tick on the 6th threshold in a future milestone.

KNOWN_UNWIRED Process: **22** (UNCHANGED).
KNOWN_UNWIRED Egress: **11** (UNCHANGED).

## What this ship is not

- Not a NASA degree advance.
- Not a codification (no new lessons promoted; existing eligible patterns still pending).
- Not a ProcessContext chokepoint chip.
- Not a `.college/` change — implementation deferred to v831.
- Not a selector wire — 2nd production caller deferred to v832.
- Not a production-behavior change when `fallbackProvider` is unset (preserves byte-identical-when-off invariant the predictive-skill-loader was built around).

## Verification

- `npm run build` → clean.
- `npx vitest run --project root src/chipset/copper/activation.test.ts src/predictive-skill-loader/` → **60 PASS / 0 fail** (4 new + 56 existing).
- Pre-tag-gate (full): expected 17/17 PASS (step 13 within-ceiling).

## T1.3 GAP-2 status after v830

| Branch | Status |
|---|---|
| Option A (gnn-predictor wire into skill activation) | CLOSED v810 (copper) + v826 (selector) |
| Option B Ship 2 (ObservationBridge interface declaration) | CLOSED v823 |
| Option B Ship 3 (onPredictions hook at 2nd production caller) | CLOSED v826 |
| Option B application-boundary wire (integration test) | CLOSED v829 |
| **Option C Framework (ConceptFallbackProvider + threshold + copper wire)** | **CLOSED v830 (this ship)** |
| Option C Impl (RosettaConceptFallback in `.college/integration/`) | OPEN — v831 |
| Option C Integration (selector wire + tests/integration/ verification) | OPEN — v832 |

Option C is now mid-arc: 1 of 3 sub-ships closed.

## Forward path post-v830

1. **v831** — `RosettaConceptFallback` in `.college/integration/`. Structurally satisfies `ConceptFallbackProvider`; uses `ConceptRegistry.search` and `getAnalogies` to find related concepts; calls `RosettaCore.translate` to render. Tests in `.college/`.
2. **v832** — `tests/integration/copper-rosetta-fallback-wire.integration.test.ts` + 2nd production caller wire in `src/orchestration/selector.ts`. Closes Option C arc.
3. **v833** — Codify ship for 4 eligible patterns: cross-rootdir wire (3 inst.), `onPredictions` (2 inst.), #10433 LOC-band refinement (3 inst.), substrate-consumer hook pair (if 2nd instance accrues by v832).

After Option C closes, NASA 1.179 remains the strong-default (48 consecutive ships at 1.178 at v830 close).
