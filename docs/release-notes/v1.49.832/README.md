> Following v1.49.831 — _T1.3 Option C Impl (RosettaConceptFallback in .college/integration/)_, v1.49.832 CLOSES the T1.3 Option C arc by wiring `ActivationSelector` as the 2nd production caller of the `fallbackProvider` field (mirrors copper at v830) and adding a `tests/integration/copper-rosetta-fallback-wire.integration.test.ts` end-to-end verification that proves the cross-rootdir wire fires the .college/ RosettaConceptFallback when copper activates a low-confidence skill. Closes the largest open T1.3 GAP-2 branch.

# v1.49.832 — T1.3 Option C Integration (Selector 2nd-Caller Wire + tests/integration/ Cross-Rootdir Verification)

**Shipped:** 2026-05-27

CLOSES the T1.3 Option C arc (v830 framework → v831 impl → v832 integration). Adds the 2nd production caller (`src/orchestration/selector.ts`) of the `fallbackProvider` substrate-consumer pattern, and an end-to-end `tests/integration/` test that exercises the full cross-rootdir flow: copper activate → predictNextSkillsWithMeta (default-off, score=0) → maxScore < threshold → .college/ RosettaConceptFallback → ConceptRegistry → RosettaCore.translate.

## Why this ship

Per the v831 README forward path: "v832 — `tests/integration/copper-rosetta-fallback-wire.integration.test.ts` (mirrors v829 pattern) + wire `RosettaConceptFallback` into `src/orchestration/selector.ts` as the 2nd production caller. Closes Option C arc."

Two distinct deliverables in one ship:
1. **2nd production caller** — selector mirrors copper's wire shape exactly, hitting the `#10426` 2-instance threshold for the `fallbackProvider` substrate-consumer pattern (which means the wire is no longer a single-caller anomaly).
2. **Cross-rootdir end-to-end verification** — proves the v830 contract + v831 implementation function together at runtime. Mirrors the v829 application-boundary wire pattern for `SkillActivationObserver` (which is now a 3-instance cross-rootdir wire family: v823 + v829 + v832).

## What shipped

- **MODIFIED** `src/orchestration/selector.ts` (~35 LOC):
  - `SelectorOptions` gains `fallbackProvider?: ConceptFallbackProvider` (mirrors copper at v830).
  - Private `fallbackProvider` field + constructor assignment.
  - `_emitPredictions` switches from `predictNextSkills` → `predictNextSkillsWithMeta` (mirrors copper).
  - Two-layer subscriber gate (skip entirely when neither `onPredictions` nor `fallbackProvider` is wired).
  - Fires `onLowConfidence(currentSkill, maxScore)` when max-score < threshold.
- **MODIFIED** `src/orchestration/__tests__/selector.test.ts` (+115 LOC, 4 new tests):
  - Fires fallbackProvider for each activated decision (default-off → max=0 < 0.30 → fires).
  - Fires both onPredictions AND fallbackProvider when both wired.
  - No fire when neither wired.
  - Selection survives a throwing fallback (fire-and-forget contract).
- **NEW** `tests/integration/copper-rosetta-fallback-wire.integration.test.ts` (~190 LOC, 4 tests):
  - `RosettaConceptFallback` structurally satisfies `ActivationContext.fallbackProvider` (compile-time check).
  - Low-confidence activation routes through copper → RosettaConceptFallback → ConceptRegistry → RosettaCore (engine.translate spy fires once with the cross-domain analogy id).
  - Translation context's `currentDomain` is set to the SUGGESTION's source domain (not the contextBase default).
  - No fire when fallbackProvider is unset (zero-side-effect contract).
  - Fail-soft when no usable analogies (search matches but no cross-domain analogy → translate never fires).
- **MODIFIED** `.planning/PROJECT.md` — pre-bump refresh v831 → v832.

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `src/orchestration/__tests__/selector.test.ts` | +4 | NEW fallbackProvider describe-block |
| `tests/integration/copper-rosetta-fallback-wire.integration.test.ts` | +4 | NEW |
| Full suite | 35,235+ | +8 net |
| **LOC delta** | ~340 (src + tests + integration) | 2 modified, 1 new |

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **50 consecutive ships at 1.178**; pressure now at the widest margin yet — most visible open item by far). Counter-cadence count UNCHANGED at 6.

Manifest entries: **22 → 22** (UNCHANGED — integration ship; codification deferred to v833).
Open lesson candidate backlog: **0** (UNCHANGED).
Tentative observations carried forward:
- **Cross-rootdir wire pattern** at **5 instances** (v823 + v829 + v830 + v831 + v832). #10426 codification threshold exceeded 4× over.
- **Substrate-consumer hook PAIR pattern** (`onPredictions` + `fallbackProvider` co-located, both fire-and-forget, both subscriber-gated, two-layer skip) now at **2 instances** (v830 copper + v832 selector). MEETS #10426 codification threshold. NEW eligibility this ship.
- **Verification-only ships** (or "integration ships with small src/ delta") — v829 + v832 (this ship's src/ delta is the selector wire mirror; majority of delta is the integration test). 2 instances; codification candidate.
- `onPredictions` substrate-consumer wire pattern still at 2 instances (v810 + v826). Eligible.
- `#10433` LOC-band-by-callsite-count refinement still at 3 instances (v825 + v827 + v828). Eligible.
- `Pick<T, K>` structural-handle narrowing for cross-rootdir consumers — still 1 instance (v831). Wait for 2nd.
- Fail-soft fallback pattern — still 1 instance (v831). Wait for 2nd.
- Cross-rootdir local-interface redeclaration discipline — still 1 instance (v831). Wait for 2nd.

Wired calibratable thresholds: **6 of 6** (UNCHANGED).

KNOWN_UNWIRED Process: **22** (UNCHANGED).
KNOWN_UNWIRED Egress: **11** (UNCHANGED).

## What this ship is not

- Not a NASA degree advance.
- Not a codification (no new lessons promoted; v833 is the codify ship at chain close).
- Not a ProcessContext chokepoint chip.
- Not a new `.college/` source file — implementation is the v831 `RosettaConceptFallback`.
- Not a production wire — the integration test demonstrates the pattern; the operator still controls whether any production `ActivationContext` or `SelectorOptions` wires `fallbackProvider`.

## Verification

- `npm run build` → clean.
- `npx vitest run --project root src/orchestration/__tests__/selector.test.ts` → **15 PASS / 0 fail** (4 new + 11 existing).
- `npx vitest run --project integration tests/integration/copper-rosetta-fallback-wire.integration.test.ts` → **4 PASS / 0 fail**.
- `npx vitest run --project root src/predictive-skill-loader/ src/chipset/copper/activation.test.ts src/orchestration/__tests__/selector.test.ts` → **75 PASS / 0 fail** (orchestration-byte-identical Gate G12 still green — substrate-consumer wire change doesn't perturb orchestration at runtime).
- Pre-tag-gate (full): expected 17/17 PASS (step 13 within-ceiling).

## T1.3 GAP-2 status after v832

| Branch | Status |
|---|---|
| Option A (gnn-predictor wire into skill activation) | CLOSED v810 (copper) + v826 (selector) |
| Option B Ship 2 (ObservationBridge interface declaration) | CLOSED v823 |
| Option B Ship 3 (onPredictions hook at 2nd production caller) | CLOSED v826 |
| Option B application-boundary wire (integration test) | CLOSED v829 |
| Option C Framework (ConceptFallbackProvider + threshold + copper wire) | CLOSED v830 |
| Option C Impl (RosettaConceptFallback in `.college/integration/`) | CLOSED v831 |
| **Option C Integration (selector wire + tests/integration/ verification)** | **CLOSED v832 (this ship)** |

**T1.3 GAP-2: ALL 7 BRANCHES CLOSED.** Largest open branch of T1.3 GAP-2 (per v829 handoff) — Option C — is now fully closed across the 3-ship arc.

## Forward path post-v832

1. **v833** — **Codify ship** at chain close. Eligible patterns:
   - **Cross-rootdir wire pattern** (5 instances) — strongest evidence; codification table will distinguish "interface-only declaration" (v823, v830) from "implementation in opposite rootdir" (v831, ObservationBridge from v823's perspective) from "integration test as application boundary" (v829, v832).
   - **Substrate-consumer hook PAIR pattern** (2 instances) — `onPredictions` + `fallbackProvider` co-located, both fire-and-forget, both subscriber-gated, two-layer skip. NEW eligibility this ship.
   - **`onPredictions` substrate-consumer wire pattern** (2 instances) — eligible since prior chain.
   - **`#10433` LOC-band-by-callsite-count refinement** (3 instances) — eligible since prior chain.
   - **Verification-only / integration-only ships** (2 instances: v829 + v832) — meta-cadence axis candidate.
2. **NASA 1.179 forward-cadence** — 50 consecutive ships at 1.178 at v832 close. Widest pressure margin of any open item.
3. Continued ProcessContext chips on remaining singletons (~13 entries).

## Most valuable single takeaway

**The cross-rootdir wire pattern is now reproducible from spec.** v823 introduced it (declare interface in rootdir A, implement in rootdir B, no direct imports). The v829 + v830 + v831 + v832 sequence proves it composes: framework → implementation → integration → second-caller. Five instances spanning two distinct contract families (`SkillActivationObserver` and `ConceptFallbackProvider`) and two distinct integration shapes (observer-receives-event and provider-returns-suggestions). Codification at v833 can lock the pattern down with the richest evidence set yet — and future cross-rootdir wires (e.g. future `.college/integration/`-side providers for selector, dashboard, or orchestration hooks) can follow the established template.
