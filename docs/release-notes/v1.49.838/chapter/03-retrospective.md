# v1.49.838 — Retrospective

**Wall-clock:** ~20 min from v837 close to v838 release-notes draft. Smallest ship of the 4-ship sequence.

## What went as expected

- **The inverse-check pattern was nearly mechanical.** Both audit tests already had a `KNOWN_UNWIRED entries actually exist and import X` test. Adding a sibling `KNOWN_UNWIRED entries do NOT call ensureXAllowed` test was symmetric: same loop over `KNOWN_UNWIRED`, same `readFileSync` + regex test, opposite assertion.
- **Both inverse-checks PASS at v838 ship time.** v834 left ProcessContext in a clean state (the off-by-one fixed). EgressContext was never tripped by a stale entry (v806-era allowlist hasn't been edited mid-wire). The inverse-check is now a permanent guard — any future ship that wires a file but forgets the allowlist edit will trip on the next pre-tag-gate run.
- **The error-message aggregation pattern landed cleanly.** Rather than throwing on the first stale entry, the test collects all stale entries into a `stale: string[]` and emits one error with the full list. Better UX for the operator doing batch cleanup; matches the chapter.mjs/publish.mjs preserve-and-log discipline (collect failures, report them all).

## What I noticed

- **LoaderContext has no `KNOWN_UNWIRED`.** This is intentional — the loader audit uses `findLoaderFiles()` to scope to a constrained set of paths, so no allowlist is needed. The inverse-check is N/A for loader. Saves work this ship, but worth a forward-flag: if LoaderContext ever adopts an allowlist pattern (e.g. extending to broader src/ scope), the inverse-check pattern from v838 will need to be replicated.
- **The `it.each` test enumeration count is misleading.** `process-context-audit.test.ts` reports 2050 tests because `it.each(files.map(...))` produces one test per src/ file. Adding 1 new `it` block adds 1 test (the loop is internal). So the report says "2050 → 2051" but conceptually it's "5 it blocks → 6". Worth knowing when reading test-count deltas in release notes.
- **The v834 release notes' forward-flag was load-bearing operationally.** Without that flag, this ship would have been a "next time we trip on a stale entry" reactive ship rather than a deterministic-gate-now proactive ship. This is the third instance this session (v836 fixed v834-835's publish.mjs flag, v837 wired v835's scaffold flag, v838 closes v834's audit-inverse-check flag). The flag-then-ship-then-close cadence is recognizable.

## What surprised me

- **The bidirectional-enforcement-completeness framing is a recognizable pattern.** I noticed mid-ship that "forward check + inverse check" is the same shape as v836's "source-side preservation + destination-side preservation" (two-layer closure pattern, #10431). v838 is the AUDIT analog: forward enforcement + inverse enforcement. The discipline generalizes from file-overwrite drift (v836) to allowlist drift (v838). Both are "drift can happen at either end of the data flow; bidirectional check closes it."
  - **Note:** this is the same observation v836 emitted as "two-layer closure generalization" — v836 was the 2nd instance after v813. v838 might be the 3rd instance of the same pattern, depending on whether "audit enforcement bidirectionality" is the same class as "file preservation bidirectionality" or a sibling class. The retrospective tentatively counts it as the same class; the codify ship can refine.

## Risk that didn't materialize

- The inverse-check might have flagged a stale entry that was actually intentional (e.g. a file that legitimately calls `ensure*Allowed` AND should stay in `KNOWN_UNWIRED` for some non-obvious reason) — checked: there is no such case in the codebase. The existing `KNOWN_UNWIRED` entries are all genuinely unwired files. If a future ship needs the "wired AND allowlisted" combination for some edge case, the test will surface it as a stale entry; the operator can then add a comment-marker exception or fix the underlying issue.
- The error message might have been hard to read for batch cleanup — chose aggregation pattern + multi-line list format. Tested mentally: if 5 stale entries existed, the error message would print all 5 paths on separate lines. Adequate.
- The regex might have caught false positives (e.g. a file that mentions `ensureProcessAllowed` only in a comment) — the regex is `\bensureProcessAllowed\s*\(/` which requires the function-call shape `ensureProcessAllowed(`. Comments referring to the function by name without the call shape don't trip it. Verified by reading the existing regex usage — same regex is used for the forward check.

## Carried forward

NEW this ship (1 instance, deferred per #10426):

- **Bidirectional enforcement completeness as a discipline-extension pattern** (1 instance: v838 audit inverse-check; conceptually 2nd instance if we count v836 as the file-preservation analog). Tentatively counted as 1 instance because v836 is "preservation" and v838 is "enforcement audit." Codify ship can disambiguate. If counted as 2 instances → ELIGIBLE FOR CODIFICATION.

Inherited from v837 close (no change):
- Polarity convention for calibratable thresholds in different mechanic classes (1 instance: v803 vs v837).

Inherited from v836 close (now 2nd instance candidate per the bidirectional observation):
- Two-layer closure generalization (#10431 sub-pattern) — STILL 2 instances if v838 is counted separately; 3 instances if v838 is the same class.

Inherited from v834-835 (no change):
- Stale-entry cleanup chip pattern (1 instance: v834).
- Scaffold ship pattern (1 instance: v835).
- Paired arc (1 arc).
- Type-registered vs observation-source-wired vs runtime-wired (1 forward-flag).
- Audit-inverse-check enhancement (1 forward-flag at v834 close → CLOSED v838).

Inherited from v833 (no change):
- Substrate-consumer hook PAIR pattern (2 instances).
- `onPredictions` substrate-consumer wire pattern (2 instances).
- #10433 LOC-band-by-callsite-count refinement (3 instances).
- Verification/integration-only ships (2 instances).

## Process retrospective

- v838 is the 3rd of 4 ships in this session. Cumulative wall-clock: v836 ~45min + v837 ~50min + v838 ~20min = ~115min total so far. Ship #4 (ProcessContext chips) is the last.
- The inverse-check enhancement was estimated at ~30min in the v834-835 handoff. Actual was ~20min — small win on estimate.
- Per-ship recon caught the LoaderContext exclusion early (~3min into the ship). Saves writing a 3rd test file that wouldn't have anything to check.
- v836 preservation gate fired 3 times during v837's T14 (validated). For v838, the chapters here are again hand-authored before refresh runs; expect 3 more PRESERVED log lines at T14 step 9.
