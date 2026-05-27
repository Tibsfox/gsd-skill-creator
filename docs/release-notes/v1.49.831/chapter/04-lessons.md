# v1.49.831 — Lessons

## New lesson candidates (0)

No new lessons codified this ship. Implementation ships in a 3-ship arc rarely close new ground — they execute a pre-recon'd plan against existing patterns. v831's novel contributions (Pick<T, K> handles, local-interface redeclaration) are noted as tentative observations for codification consideration once a 2nd instance accrues.

## Forward-test of existing lessons

### #10416 — Lightest wire

**Status:** RESPECTED. v831 adds exactly 2 NEW files (1 src + 1 test) inside the existing `.college/integration/` directory. Zero modifications to existing src/ or .college/ source code. The Pick<>-narrowed handle types are the lightest type-constraint that supports both test mocks and v832's real-instance passing.

### #10426 — Second-instance threshold

**Status:** EXCEEDED for cross-rootdir wire (now 4 instances: v823 + v829 + v830 + v831). Codification at v833 codify ship will draw on the richest evidence set yet for this pattern. NEW patterns introduced at v831 (Pick<T, K> handles, local-interface redeclaration, fail-soft fallback) all sit at 1 instance — wait for 2nd.

### #10427 — Failure-mode contracts

**Status:** RESPECTED. Every external boundary (`registry.search`, `engine.translate`, `expr.explanation` access) is wrapped in try/catch returning `null`. The substrate-consumer caller (copper's emitPredictions) already swallows the entire fallback chain in its own catch — making `null` returns from the provider equivalent to thrown errors but with explicit semantics ("no fallback applied" vs "fallback crashed"). Per #10427's silent-vs-loud test: caller's next decision doesn't depend on the fallback output → load-bearing classification is observability → silent fail-soft is correct.

### #10428 — Meta-cadence

**Status:** No axis tick this ship. Wired calibratable thresholds unchanged at 6/6 (v830 ticked calibrate). v831 is a code-axis (implement existing pattern); doesn't fit cleanly into codify/consume/calibrate categories. Per #10428's framework, "verify" or "implement" may merit a 4th axis if such ships recur — v829 was the first noted such ship (verification-only); v831 is similar (implementation-only after framework-only predecessor).

### #10432 — KNOWN_UNWIRED ledger

**Status:** NOT EXERCISED. v831 is not a chokepoint chip; ledger entries unchanged at Process=22 / Egress=11.

### #10433 — Internal-helper pattern

**Status:** NOT EXERCISED. v831 is purely a new class in `.college/integration/`; no security-context threading.

### #10434 — Discipline coverage ratchet

**Status:** UNCHANGED (UNCODIFIED 39, ceiling 41, buffer 2). v831 doesn't add a new discipline doc; existing discipline coverage holds.

## Tentative observations carried forward

| Observation | Instances | Notes |
|---|---|---|
| **Cross-rootdir wire pattern** (interface in rootdir A + impl in rootdir B, duck-typed) | 4 (v823 + v829 + v830 + v831) | EXCEEDED #10426 threshold 3× over. Codify at v833. |
| **`onPredictions` substrate-consumer wire pattern** | 2 (v810 + v826) | Eligible from prior chain. Codify at v833. |
| **#10433 LOC-band-by-callsite-count refinement** | 3 (v825 + v827 + v828) | Eligible from prior chain. Codify at v833. |
| **`Pick<T, K>` structural handle narrowing for cross-rootdir consumer types** (avoid concrete import; preserve subtyping) | 1 (v831) | Wait for 2nd. |
| **Fail-soft fallback pattern** (try/catch returning `null` at every external boundary) | 1 (v831) | Wait for 2nd. |
| **Cross-rootdir local-interface redeclaration discipline** (declare locally with inline maintenance note that the shape MUST mirror the canonical src/ declaration) | 1 (v831) | Wait for 2nd. |
| **Substrate-consumer hook PAIR pattern** (`onPredictions` + `fallbackProvider` co-located) | 1 (v830) | Wait for 2nd — v832 selector wire is the likely accrual point. |
| **DI-executor + hoisted-check refinement of #10433** | 1 (v827) | Wait for 2nd. |
| **`'spawn'` op-tag at family scale** | 1 (v828) | Wait for 2nd. |
| **Verification-only ships** (no src/ change; only tests/integration/ test) | 1 (v829) | Wait for 2nd — v832 is a candidate if its src/ delta is only the selector wire (~10 LOC). |
| **Threading config-derived constants through result objects** | 1 (v830) | Wait for 2nd. |

## Cadence observation

This ship and v829 share a "verify/implement existing wire" shape — neither is consume (chokepoint chip), codify (lesson promotion), or calibrate (threshold tick). They're closer to "ship infrastructure work that lets the next ship be a 1-LOC wire change."

If v832 ships in this same shape (small src/ delta + integration test), the pattern repeats 3 times in this single arc, and a 4th operational axis ("implement" or "verify") may earn explicit naming at the next #10428 review. For now, tracked as observation only.
