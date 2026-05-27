# v1.49.821 — Retrospective

**Wall-clock:** ~25 min from chain-continuation to tag-push. Sixth ship of the v816-822 chain.

## What worked

**Ceiling-based BLOCK is the right shape for "flip without breaking."** The audit said "flip step 13 to BLOCK" — naive interpretation: just set `SC_PRE_TAG_GATE_REQUIRE=discipline-coverage` as default. Reality: 39 UNCODIFIED would immediately break every pre-tag-gate run. The ceiling pattern: BLOCK only when count EXCEEDS the ceiling. Set ceiling to soak value (50) for now; tighten gradually. v822 lands the tighten + default-flip.

**Two-ship sizing was right.** Audit said "2 ships." Ship 1: infrastructure (this ship). Ship 2: flip the default. The infrastructure-then-flip pattern matches v807-v813's two-layer closure shape — first the detector, then the source-eliminator. Both layers required for a clean closure.

**The 11-unit soak buffer is operator-tunable.** Default ceiling is 50; current count is 39; difference is 11. The 11-unit buffer absorbs near-term chain ships' tentative-observation accumulation. v816-v820 each added ~1-3 tentative observations; if some promote to lessons that get carried forward without being codified, the buffer absorbs them. The next codify ship (whenever it lands) drops the UNCODIFIED count.

**Code change was minimal.** Tool: +25 LOC (flag + validation + check + help). Gate: +20 LOC (env var + branching). Two files; all in `tools/`. No data-source changes; no discipline-doc changes; no test changes (existing tests don't exercise the new flag because there are no vitest tests for these tools — only shell smoke tests).

## What surprised

**The discipline-coverage tool had no vitest tests.** Tools like `state-md-set-shipped.mjs` have unit tests in `tools/__tests__/`; `check-discipline-coverage.mjs` has none. The smoke verification is the shell test (run the tool, observe output, check exit code). This is consistent with the tool being a comparable-output static analyzer — vitest unit tests would only verify the parsing/formatting logic, not the analytical correctness which depends on the live release-notes corpus. Adding tests would be useful but out of scope per #10416 (the tool has been in production since v653 without tests; adding them now is a separate ship).

**The audit's "2 ships" was an accurate sizing.** Ship 1 = infrastructure (~25 min); Ship 2 = flip (~25 min). 50-min total wall-clock for T2.2 closure matches the audit's prediction within 10%.

**The ceiling pattern generalizes to KNOWN_UNWIRED.** Discipline-coverage's UNCODIFIED count + ceiling is shape-equivalent to KNOWN_UNWIRED's grandfathered-entries count + (implicit) ceiling. The discipline #10432 (KNOWN_UNWIRED ledger) could be generalized to "any debt-ledger pattern": count + ceiling + chip-down cadence. Potential codify-ship observation if a 2nd or 3rd instance accumulates.

## What to watch

- **v822 needs to verify the gate behavior post-flip.** The post-v821 default is still WARN-only (count 39 < ceiling 50). v822 will lower the ceiling AND flip the default to BLOCK at the ceiling. Verification: pre-tag-gate runs at current state, ceiling = 40 (say), count = 39 < 40 → PASS. Then a hypothetical 40+1 = 41 UNCODIFIED would FAIL.

- **The ceiling is currently soak-buffer-padded.** If v822 sets default to 40, the buffer is 1. Adding any new UNCODIFIED lesson would immediately fail the gate. The right operator-pattern is: keep the buffer at ~5-10 to absorb tentative-observation churn between codify ships.

- **The tool's smoke test isn't in CI.** The verification of v821 is "I ran the tool and observed exit codes." A future ship could add proper vitest unit tests for the parser + validation logic. Out of scope per #10416.

## Verdict on scope

Closed at the canonical infrastructure-ship shape: 2 files + ~45 LOC + 5 release-notes files. Resisted: chipping the 39 UNCODIFIED lessons (8+ ship cost), building an auto-classifier, adding vitest tests for the tool. The infrastructure is exactly the minimum to support v822's flip without immediate breakage.

After v821, the v816-822 chain has 2 ships remaining: v822 (gate flip) + v823 (ObservationBridge wire). Estimated ~80 min total.
