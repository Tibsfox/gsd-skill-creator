> Following v1.49.830 — _T1.3 Option C Framework (ConceptFallbackProvider Interface + Threshold + Copper Wire)_, v1.49.831 ships the IMPLEMENTATION half of T1.3 Option C: `RosettaConceptFallback` in `.college/integration/rosetta-concept-fallback.ts` (~145 LOC) + 9-test unit suite. The provider structurally satisfies the v830 `ConceptFallbackProvider` contract from src/ via cross-rootdir duck-typing — same shape as the v823 ObservationBridge ↔ SkillActivationObserver wire. No src/ files modified; no production-behavior change until v832 wires a 2nd production caller.

# v1.49.831 — T1.3 Option C Impl (RosettaConceptFallback in .college/integration/)

**Shipped:** 2026-05-27

Closes the implementation half of T1.3 Option C. Provides a working concept-fallback engine backed by `RosettaCore` + `ConceptRegistry` that answers low-confidence skill activations with cross-domain analogies. The v830 wire on copper now has a real provider to fire — though no production caller wires it yet (operator-controlled; v832 demonstrates the wire end-to-end via tests/integration/).

## Why this ship

Per the v830 README (forward path): "v831 — `RosettaConceptFallback` in `.college/integration/`. Structurally satisfies `ConceptFallbackProvider`; uses `ConceptRegistry.search` and `getAnalogies` to find related concepts; calls `RosettaCore.translate` to render. Tests in `.college/`."

Recon at v830 corrected the handoff's mention of `getAnalogiesByDomain` — the actual method is `getAnalogies(id, targetDomain)`. v831 sidesteps the domain-filter entirely and computes cross-domain filtering inline (`target.domain !== concept.domain`) so the provider can return analogies in ANY other domain rather than requiring a target-domain hint.

## What shipped

- **NEW** `.college/integration/rosetta-concept-fallback.ts` (~145 LOC):
  - Declares a local `ConceptSuggestion` interface (byte-equivalent to the v830 src/-side declaration) — duck-typing across the rootdir boundary.
  - Declares `RegistryHandle` (`Pick<ConceptRegistry, 'search' | 'get'>`) and `EngineHandle` (`Pick<RosettaCore, 'translate'>`) structural-only handles so tests can pass thin mocks and v832 can pass real instances (subtyping accepts both).
  - `RosettaConceptFallback` class with `onLowConfidence(currentSkill, maxScore): Promise<ConceptSuggestion[] | null>`.
  - Pipeline: `registry.search(currentSkill)` → filter `analogy` relationships by `target.domain !== source.domain` → `engine.translate(analogyId, context)` → shape as `ConceptSuggestion`.
  - Fail-soft: any internal throw (registry.search, engine.translate, render-format) returns `null` rather than propagating. Aligns with #10427 — fallback is observability-only and the caller swallows errors anyway.
  - `maxSuggestions` cap (default 5) bounds work per call.
- **NEW** `.college/integration/rosetta-concept-fallback.test.ts` (~220 LOC, 9 tests):
  - `null` on no matches.
  - `null` on no analogy relationships.
  - `null` on same-domain analogies (cross-domain filter at work).
  - Suggestions for cross-domain analogies when render succeeds.
  - `currentDomain` in translation context is set to the suggestion's source domain (not the contextBase default).
  - `null` when every render throws (fail-soft contract).
  - `maxSuggestions` cap respected.
  - `null` when `registry.search` itself throws (fail-soft).
  - Compile-time structural conformance to `ConceptFallbackProvider`.
- **MODIFIED** `.planning/PROJECT.md` — pre-bump refresh v830 → v831.

No src/ files modified — the v830 framework already accepts any `ConceptFallbackProvider`-shaped object on `ActivationContext.fallbackProvider`. v831 ships a concrete provider; v832 wires a 2nd production caller.

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `.college/integration/rosetta-concept-fallback.test.ts` | +9 | NEW |
| Full suite | 35,227+ | +9 net |
| **LOC delta** | ~365 (1 src + 1 test file) | 2 new files |

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **49 consecutive ships at 1.178**). Counter-cadence count UNCHANGED at 6.

Manifest entries: **22 → 22** (UNCHANGED — implementation ship; codification deferred to v833).
Open lesson candidate backlog: **0** (UNCHANGED).
Tentative observations carried forward:
- Cross-rootdir wire pattern now at **4 instances** (v823 declaration + v829 verification + v830 framework + v831 implementation). #10426 codification threshold exceeded 3× over.
- Cross-rootdir interface CONSUMER pattern (Pick<T, K> structural-only handle types in the .college/ side, replacing the import-restricted concrete type) is a NEW tentative observation at 1 instance.
- Fail-soft fallback pattern (try/catch around each external boundary returning `null` rather than propagating) — 1 instance. Wait for 2nd.

Wired calibratable thresholds: **6 of 6** (UNCHANGED — `lowConfidenceThreshold` from v830 stays at the registered count; no new tunable surface this ship).

KNOWN_UNWIRED Process: **22** (UNCHANGED).
KNOWN_UNWIRED Egress: **11** (UNCHANGED).

## What this ship is not

- Not a NASA degree advance.
- Not a codification (no new lessons promoted).
- Not a ProcessContext chokepoint chip.
- Not a src/ change — the provider lives entirely in `.college/integration/`.
- Not a production-behavior change for un-wired operators — `ActivationContext.fallbackProvider` is still optional, still defaults to unset.
- Not a 2nd-instance ship for the substrate-consumer hook PAIR pattern (still only wired on copper; selector wire arrives in v832).

## Verification

- `npm run build` → clean.
- `npx vitest run .college/integration/rosetta-concept-fallback.test.ts` → **9 PASS / 0 fail**.
- `npx vitest run .college/integration/` (full subdirectory) → **52 PASS / 0 fail**.
- Pre-tag-gate (full): expected 17/17 PASS (step 13 within-ceiling).

## T1.3 GAP-2 status after v831

| Branch | Status |
|---|---|
| Option A (gnn-predictor wire into skill activation) | CLOSED v810 (copper) + v826 (selector) |
| Option B Ship 2 (ObservationBridge interface declaration) | CLOSED v823 |
| Option B Ship 3 (onPredictions hook at 2nd production caller) | CLOSED v826 |
| Option B application-boundary wire (integration test) | CLOSED v829 |
| Option C Framework (ConceptFallbackProvider + threshold + copper wire) | CLOSED v830 |
| **Option C Impl (RosettaConceptFallback in `.college/integration/`)** | **CLOSED v831 (this ship)** |
| Option C Integration (selector wire + tests/integration/ verification) | OPEN — v832 |

Option C is now 2 of 3 sub-ships closed.

## Forward path post-v831

1. **v832** — `tests/integration/copper-rosetta-fallback-wire.integration.test.ts` (mirrors v829 pattern) + wire `RosettaConceptFallback` into `src/orchestration/selector.ts` as the 2nd production caller of the `fallbackProvider` field. Closes T1.3 Option C arc.
2. **v833** — Codify ship for 3-4 eligible patterns: cross-rootdir wire (4 inst.), onPredictions wire (2 inst.), #10433 LOC-band refinement (3 inst.), substrate-consumer hook pair (if v832 lands the 2nd instance).

After Option C closes and the codify ship lands, NASA 1.179 forward-cadence is the strong-default (50 consecutive ships at 1.178 expected by then — most visible open item by an even wider margin).
