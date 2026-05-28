# v1.49.866 — Retrospective

**Wall-clock:** ~12 min from v865 close. New wire shape this ship — DI-fetch-wrapper variant — required slightly more care than mechanical chip but transferred cleanly.

## What went as expected

- **DI-fetch-wrapper variant transferred from #10441's DI-executor + tokenized-argv pattern.** The Process-side DI-executor pattern (codified v847) has a fetch-side analog: factory-pattern with injected DI overrides + closure-bound default that wires through. Same shape, different surface.
- **Bypass semantics tested.** Injected fetchFn callers own their own security boundary; the test for "no audit records when fetchFn provided" verifies that contract.

## What I noticed

- **First Egress wire-shape new since Track 3 opened.** v863 + v864 + v865 all used hoist-at-top variants. v866 introduces DI-fetch-wrapper — the first new shape in Track 3. Confirms the chip-pick-by-size correlation with wire-shape diversity observed in Track 2 (Track 3 evidence is starting to accumulate).
- **Cross-audit tool's 9th consecutive clean application.**

## What surprised me

- **The injected-fetchFn bypass is a structurally interesting pattern.** It's NOT a security hole — the convention is that test callers KNOW they're using a mock fetch and own the security context. Real-deployment callers go through `defaultFetch`. Pre-existing DI pattern just happened to align with the security model.

## Carried forward (post-v866)

NEW this ship: 1 below-threshold observation.

- **DI-fetch-wrapper as Egress analog of #10441** — 1 instance (v866). The Process-side DI-executor + tokenized-argv pattern has a fetch-side analog: factory accepts injected fetch override; the default wrapper closes over ctx and wires through. Wait for 2nd instance from a future Egress chip (e.g., http-client.ts likely candidate at v867 or beyond). Likely classification: sub-pattern of #10441 (cross-surface refinement).

REINFORCED:
- Cross-audit tool continuous-verification (v858-v866, 9 instances).
- Chip-pick by size correlates with wire-shape diversity (Track 3 evidence: hoist-at-top × 3 + DI-fetch-wrapper × 1).

## Campaign progress

**10 of ~11 ships shipped.** Track 3 at 4 of ~5; v867 remaining.
