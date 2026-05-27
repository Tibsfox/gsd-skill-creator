# v1.49.833 — Lessons

## New lesson candidates (1)

### Lesson #10435 — Cross-rootdir wire pattern

**Status:** CODIFIED this ship.

**Scope:** Wiring a substrate-consumer relationship between `src/` and `.college/` (or any future rootdir pair) without violating the strict no-cross-import boundary.

**The 4-step pattern:**
1. Declare the interface in the CONSUMER rootdir with minimal primitive field types.
2. Implement the satisfier in the PROVIDER rootdir via duck typing (no `implements` keyword; no cross-import).
3. Bridge via an optional context field that's no-op when unset.
4. Verify with a `tests/integration/*.integration.test.ts` test that has visibility into BOTH rootdirs.

**Evidence anchor:** 5 instances across 2 contract families:
- `SkillActivationObserver` family: v1.49.823 (interface declaration) + v1.49.829 (application-boundary verification).
- `ConceptFallbackProvider` family: v1.49.830 (framework) + v1.49.831 (implementation) + v1.49.832 (integration + 2nd-caller wire).

**Subordinate patterns** (declared inside the same discipline doc):
- **Local-interface redeclaration discipline** — when the satisfier RETURNS a typed value, the provider rootdir locally redeclares the result type byte-equivalently. Drift between the two declarations is silent; mitigation is inline maintenance pairing notes + minimal interfaces. Evidence: `ConceptSuggestion` declared in both `src/predictive-skill-loader/fallback.ts` and `.college/integration/rosetta-concept-fallback.ts` (v830 + v831).
- **`Pick<T, K>` structural-handle narrowing** — when constructor opts accept concrete classes, type them as narrowed handles. Tests pass thin mocks without a cast; real instances still flow through subtyping. Evidence: `RegistryHandle = Pick<ConceptRegistry, 'search' | 'get'>` and `EngineHandle = Pick<RosettaCore, 'translate'>` in `.college/integration/rosetta-concept-fallback.ts` (v831).

**Discipline doc:** `docs/cross-rootdir-wire-discipline.md`.

## Forward-test of existing lessons

### #10416 — Lightest wire

**Status:** RESPECTED. v833 is documentation-only — 1 new doc + 1 manifest entry. Zero src/ changes; zero test changes.

### #10426 — Second-instance threshold

**Status:** EXERCISED. Cross-rootdir wire codified at 5 instances — well past the 2-instance threshold. The 5-instance evidence base let the discipline doc distinguish 4 ship shapes (declaration / framework / implementation / integration) AND 2 subordinate patterns (local redeclaration / Pick<> narrowing). A 2-instance codification could not have done that.

### #10428 — Meta-cadence

**Status:** codify-axis tick: RESET. Last codify ship was v824 (9 ships ago at v833 open); v833 resets to 0 ships ago.

### #10432 — KNOWN_UNWIRED ledger

**Status:** NOT EXERCISED. v833 is not a chokepoint chip; Process=22 / Egress=11 UNCHANGED.

### #10433 — Internal-helper pattern

**Status:** NOT EXERCISED. The LOC-band refinement (which extends #10433) is DEFERRED to next codify ship along with the other 3 eligible patterns.

### #10434 — Discipline coverage ratchet

**Status:** UNCODIFIED count UNCHANGED at 39 (≤ ceiling 41). Cross-rootdir wire wasn't previously UNCODIFIED — it was a tentative observation, not a numbered lesson — so adding it to the manifest doesn't reduce the UNCODIFIED count. The ratchet ledger holds.

## Tentative observations carried forward (3 patterns + 1 axis observation)

These 3 patterns + 1 axis observation are eligible for codification at the NEXT codify ship (likely v840+). All are tracked in `docs/cross-rootdir-wire-discipline.md` § "Carried-forward observations" for visibility.

| Observation | Instances | Notes |
|---|---|---|
| **Substrate-consumer hook PAIR pattern** | 2 (v830 copper + v832 selector) | Both fire-and-forget, both two-layer subscriber-gated, both observability-only. Candidate for new discipline OR extension to `docs/architecture-retrofit-patterns.md`. |
| **`onPredictions` substrate-consumer wire pattern** | 2 (v810 + v826) | Specific to the predictive-skill-loader integration. May fold into the substrate-consumer hook pair codification rather than getting its own entry. |
| **#10433 LOC-band-by-callsite-count refinement** | 3 (v825 + v827 + v828) | Extends an EXISTING discipline (`docs/security-chokepoints.md`); next codify ship can append the LOC-band table to that doc. |
| **Verification/integration-only ships** (axis observation) | 2 (v829 + v832) | Candidate extension to `docs/meta-cadence-discipline.md` — verify-axis as sibling to codify/consume/calibrate. |

Other 1-instance observations from the v830-832 arc (Pick<T,K> handles, fail-soft fallback, local-interface redeclaration) are now SUBSUMED into the cross-rootdir-wire discipline as subordinate patterns — no separate carry-forward needed.

## Cadence observation

This is the first **chain-close codify ship** in recent memory — codifying patterns accumulated by a tightly-coupled 3-ship single-feature arc immediately at +1. v824 was an isolated codify ship; v833 is a chain-close codify ship.

If the chain-close codify pattern (3-4 ship single-feature arc → +1 codify ship that synthesizes the arc's accrued patterns) recurs, it may be worth codifying as a meta-cadence sub-pattern. Waiting for a 2nd instance.
