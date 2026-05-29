# v1.49.892 — Retrospective

## What worked

**Two-site hoisted-check fell out naturally from the file's existing shape.** scanner.ts already exposed two entries; the wire just added `ctx?` to both signatures + one `ensureAllowed` at the top of each. No structural refactoring required. Tests followed the v889 pattern directly, with one extra test verifying outer-denial-before-loop-runs (only 1 audit record when busDir is rejected).

**Audit-record count test is load-bearing for two-site shapes.** The test `'emits an audit record for the busDir at scanForBundles + one per priority subdir scanned'` asserts exactly 9 records (1 outer + 8 inner). Without that assertion, a future refactor that deduplicates the inner gate would silently pass — counting is the only way to detect the change. Worth carrying forward as a test-discipline pattern for two-site hoisted-check.

**Production caller unaffected.** `transport.ts:92` calls `scanForBundles(this.config)` with no ctx; signature accepted the new optional positional. Zero call-site churn matches the chokepoint-retrofit ergonomics promised by #10414.

## What didn't work

**No new surprises.** The chip ran clean — wire shape was a textbook application of #10448 plus #10442 (denial-propagates-outside-try-catch). The only judgment call was whether to gate `scanPriorityDirWithBundles` separately or rely on the outer `scanForBundles` gate. Gating both is the only safe choice because the inner function is also exported and callable directly. Documented inline.

## Verdict on scope

First ship of the v892-v895 multi-ship session. ~15 min wall-clock. Smallest of the four planned ships by LOC count (174). Lighter than v887/v889/v890 because scanner.ts is structurally simple (two functions, one production caller). The two-site hoisted-check surfaced as a new sub-variant — promotion-eligible at 2nd instance.

## Promotion-eligible candidates accumulated this ship

1. **Two-site hoisted-check sub-variant of #10448** (1 instance v892). When a file exports multiple entry points that each touch fs and may be called directly, each entry gates independently. No deduplication is safe because the inner-entry direct-caller path bypasses the outer gate. Promotion-eligible at 2nd instance (likely on `memory/conversation-store.ts` or `memory/file-store.ts` if they expose multiple read entries).

2. **Audit-record-count test for two-site shapes** (1 instance v892). When the wire shape produces N audit records per outer invocation, assert exactly N — this is the only way to detect future deduplication regressions. Promotion-eligible at 2nd instance.

## Forward path

**Continue v892-v895 session.** Next ships per the v891 handoff's options 3/4/5:

- v893 — Substrate auto-emit for `token_budget.max_percent` (option 3; second instance of v891's substrate-wrapper pattern → promotes to 2-instance ESTABLISHED).
- v894 — Integration test for `observation.retention_days` calibration loop (option 4; verify-axis check within 10-ship budget per #10428).
- v895 — Counter-cadence codify ship (option 5; absorb the ~12 promotion-eligible candidates).
