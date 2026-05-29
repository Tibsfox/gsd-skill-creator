# v1.49.894 — Retrospective

## What worked

**v856 template was the right starting point.** The predictive-low-confidence integration test had the exact shape needed: temp dir setup, substrate-side write, fire-and-forget wait, calibration-read assertion, polarity-value check, missing-file + malformed-line edge cases. v894 changed the threshold name, the substrate function, and the polarity-mapping facts; the structural skeleton transferred cleanly.

**Multi-sweep accumulation test exercises the polarity logic.** The test that runs 3 sweeps with `[too_aggressive, too_aggressive, too_lax]` and asserts `[-1, -1, 1]` with net `-1` is the load-bearing part. Single-event tests prove the wire works once; multi-event tests prove polarity flows through ordered writes. Mirrors v856's multi-event test.

**3-ship-after-wire is well within budget.** #10428 sets the verify-axis trigger at 10 ships. Shipping at 3 ships means the test surfaces any wire bugs immediately rather than waiting for the budget ceiling. No bugs found; the wire is clean. Worth noting that v856 shipped at 10 ships exactly (canonical trigger); v894 shipping early surfaces the optionality.

## What didn't work

**No new surprises.** The integration test ran clean on the first try. The v891 substrate and v884 read-side were both well-tested with mocks; the integration test confirmed the same behavior through real fs collaborators.

**Mild: `setTimeout(50ms)` is now hit twice in test files.** v891 unit test + v894 integration test both use it. The 2-instance threshold is reached for the test-side wait pattern (promoted v891→v893→v894). v895 counter-cadence will codify.

## Verdict on scope

Third ship of the v892-v895 multi-ship session. ~15 min wall-clock (lightest of the four planned ships because no production code changed — only test surface). The v856 template made this near-mechanical.

## Promotion-eligible candidates

1. **"Substrate→calibration end-to-end test" pattern** — **promoted 1→2** (v856 predictive + v894 retention). 7-step test shape: temp dir → substrate write → fire-and-forget wait → calibration read → polarity assertion → missing-file → malformed-line. Codify in v895.

2. **"3-ship-after-wire optional ship within #10428 budget"** (1 instance v894). Verify-axis trigger is at 10 ships; nothing prevents shipping earlier when the substrate is fresh + bug-detection signal is strongest. Promotion-eligible at 2nd instance (likely on token_budget.max_percent integration test if shipped before v903).

## Forward path

**Continue v892-v895 session.** Next ship:

- v895 — Counter-cadence codify ship (option 5; absorb promoted candidates + carry-forward 1-instance accumulators).
