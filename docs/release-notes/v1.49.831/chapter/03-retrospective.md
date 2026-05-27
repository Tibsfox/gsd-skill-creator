# v1.49.831 — Retrospective

**Wall-clock:** ~25 min from v830 close to v831 release-notes draft. Implementation ship of v830-832 Option C arc.

## What went as expected

- **Cross-rootdir duck-typing held.** The `ConceptSuggestion` interface declared in src/predictive-skill-loader/fallback.ts has a byte-equivalent twin in .college/integration/rosetta-concept-fallback.ts. TypeScript accepts the structural match without either side importing the other.
- **`Pick<RosettaCore, 'translate'>` and `Pick<ConceptRegistry, 'search' | 'get'>` cleaned up the testability story.** Originally I typed the constructor opts as the concrete classes, then refactored mid-flight when the test file needed thin mocks. The narrowed handle types let tests pass `{ translate: vi.fn(...) }` without a cast AND still accept real instances at v832's integration boundary.
- **Fail-soft contract was unambiguous.** Three external boundaries (registry.search, engine.translate, render-format access) each get their own try/catch returning `null`. Aligns with #10427 — the user's next decision doesn't depend on the fallback's output, so silent-fail is correct.
- **All 9 tests pass on first run.** No iteration needed. The pipeline shape (search → analogy-filter → translate) was clear from v830 recon; v831 just executed it.

## What I noticed

- **The pipeline naturally has TWO filters: search-matches and cross-domain.** `registry.search` returns concepts where the skill string appears in name or description. Then I filter the matches' `analogy` relationships by `target.domain !== source.domain`. Operators may want to invert this ("find SAME-domain analogies" or "find any analogy regardless of domain") in future. For v831 the cross-domain filter matches the handoff's stated goal: "find an analogous concept from another department."
- **`maxSuggestions` cap (default 5) is essential.** A skill that matches many concepts each with many analogies could produce a huge result. The cap bounds work; tests confirm it short-circuits both the outer loop and the inner loop.
- **The `Pick<T, K>` narrowing is a NEW pattern.** Previous cross-rootdir wires (v823 ObservationBridge ↔ SkillActivationObserver) imported full concrete types; v831 uses narrowed handles. This is the first instance of the "import-restricted handle" pattern; whether it generalizes depends on how often integration code needs only a subset of an external class.
- **Local interface redeclaration is required.** `ConceptSuggestion` exists in both rootdirs — neither side imports the other. Field drift between the two declarations would silently break the contract (only the call site catches it, not the result-shape consumer). This is a known cost of cross-rootdir duck typing; documented inline as a maintenance note in the .college/ file.

## What surprised me

- **`Pick<>` plays nicely with `vi.fn` mocks.** I expected at least one cast — but `vi.fn((query: string, domain?: string) => RosettaConcept[])` is structurally assignable to `ConceptRegistry['search']`. Same for `engine.translate`. The test factory functions are pure TypeScript with no type assertions.
- **The duck-typed compile-time check needed an inline interface declaration.** I wrote `const provider: ConceptFallbackProvider = fallback;` initially — but ConceptFallbackProvider lives in src/ which .college/ can't import. So I inlined the structural shape `{ onLowConfidence(skill: string, score: number): Promise<ConceptSuggestion[] | null> }` in the test. This is the v829 pattern (where the integration test in tests/integration/ DID import from both sides). Inside .college/ alone, the cross-rootdir check has to use a structural-shape literal.

## Risk that didn't materialize

- The narrowed `EngineHandle` type might have rejected a real `RosettaCore` instance in v832. It won't — TypeScript subtyping accepts an instance with MORE methods being passed to a slot requiring FEWER. The narrowed handle is purely a write-side constraint on the option's TYPE; the value being passed is unrestricted.
- The `translate` mock factory might have needed updates to match RosettaCore's full Translation type. It didn't — TypeScript checks the value returned by `translate` against the actual return type `Promise<Translation>`. My mock returns a structurally-compatible object (id + primary + concept + panels + dependenciesLoaded). Vitest accepted it.

## Carried forward

- **Cross-rootdir wire pattern: 4 instances** (v823 + v829 + v830 + v831). #10426 threshold exceeded 3× over.
- **`Pick<T, K>` structural-handle narrowing pattern for cross-rootdir consumers**: 1 instance (v831). Wait for 2nd.
- **Fail-soft fallback pattern**: 1 instance (v831). Wait for 2nd.
- **Cross-rootdir local-interface redeclaration discipline** (declare locally + document inline that the shape must mirror src/): 1 instance (v831). Wait for 2nd.

## Forward-test of existing lessons

| Lesson | Status |
|---|---|
| #10416 lightest wire | RESPECTED — single new src + test file, no modifications to existing src/ code |
| #10426 second-instance threshold | EXCEEDED — cross-rootdir wire at 4 instances |
| #10427 failure-mode contracts | RESPECTED — fail-soft `null` returns at every external boundary; the caller swallows errors anyway |
| #10432 KNOWN_UNWIRED ledger | NOT EXERCISED — not a chokepoint chip |
| #10433 internal-helper | NOT EXERCISED — not a chokepoint chip |
| #10434 discipline coverage ratchet | UNCHANGED (UNCODIFIED 39, ceiling 41, buffer 2) |

## Cadence observation

This is the implementation ship of a 3-ship arc. v830 framework + v831 impl + v832 integration is a textbook "declare → satisfy → wire" partition. Wall-clock per ship is converging on ~25-40 min for this arc, faster than the v829-handoff prediction of ~45-60 min per ship — recon at v830 paid off.

The codify-axis (#10428) is now 7 ships ago (last was v824) — right at the lower bound of the 7-10 ship floor. v833 codify ship at chain close will reset cleanly.
