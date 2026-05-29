# v1.49.893 — Retrospective

## What worked

**Outcome-driven kind selection fell out naturally from the substrate shape.** v891's substrate (RetentionManager.prune) returns a count but the count doesn't determine polarity — operator intent decides. So v891 defaulted to `too_aggressive` and let operators flip via CLI. v893's substrate IS a threshold compare: the polarity is the result of the same inequality. Forcing v891's default-fixed shape on v893 would have been an awkward mismatch. Both shapes coexist as valid sub-variants of the substrate-wrapper pattern; the polarity-derivation question is the discriminator.

**ZERO UNWIRED for the first time.** The verify-overdue-scan output now shows all 7 thresholds with at least a substrate-side caller. This is a campaign milestone — closes the last gap from the registry's initial extension. The PENDING-TEST count went up (now 2: observation.retention_days at v891 + token_budget.max_percent at v893), but that's the verify-axis work-in-progress signal, not unfinished work.

**Substrate-wrapper pattern 1→2 ESTABLISHED.** v891's pattern was 1-instance carry-forward. This ship is the second instance, promoting it to 2-instance ESTABLISHED. The polarity-derivation sub-variant (outcome-driven vs default-fixed) is itself a new 1-instance candidate emerging from the comparison.

## What didn't work

**Fire-and-forget failure test is structurally weak.** v891's test passes an unwritable deeply-nested path; the auto-emit's mkdir actually succeeds (creates the dirs). v893's test does the same. The actual failure mode (appendFile fails after mkdir succeeds) is hard to reliably trigger in tests. The .catch swallow is the only protection. Both tests assert the function returns a valid result; they don't actually exercise the catch arm. Worth noting as a test-discipline limitation: pinning fire-and-forget contracts is inherently weak when the failure mode is rare and hard to inject.

**The substrate is "ready to be wired" rather than "wired into a hot path."** Production code that monitors token-budget usage hasn't yet been refactored to call `runTokenBudgetCeilingCheck`. The substrate's existence + tests + verify-overdue-scan flip is enough to close the calibrate-axis loop per #10439, but the hot-path wiring is a separate concern. Same shape as v891 retention-substrate (no hot-path caller in production code yet).

## Verdict on scope

Second ship of the v892-v895 multi-ship session. ~25 min wall-clock. Comparable to v891 ~25min. The substrate-wrapper pattern is well-rehearsed by now (this is the third instance overall, second within the substrate-wrapper sub-pattern). The polarity-derivation choice was the only new judgment call.

## Promotion-eligible candidates accumulated this ship

1. **Substrate-wrapper pattern: outcome-driven vs default-fixed sub-variants** (1 instance v893). The pattern has two sub-shapes:
   - **Default-fixed** (v891 retention): substrate returns work-count; polarity is operator-intent; default kind is conservative-bias.
   - **Outcome-driven** (v893 ceiling-check): substrate IS a comparison; polarity falls out of the result; default kind is the comparison outcome.
   The discriminator is "does the substrate's natural output determine polarity?" Promotion-eligible at 2nd outcome-driven instance.

2. **Fire-and-forget test limitation** (1 instance v893 + 1 instance v891 — sibling observations). Tests for fire-and-forget contracts can't reliably trigger the failure path without OS-level setup. The structural protection is the `.catch` swallow; the test asserts only that the function returns a valid result. Worth a test-discipline note for future fire-and-forget surfaces. Promotion-eligible at 2nd EXPLICIT instance (v891 + v893 are an implicit sibling pair).

3. **Fire-and-forget test-side wait `setTimeout(50ms)`** — **PROMOTED to 2-instance** (v891 + v893). Promotion to ESTABLISHED candidate within counter-cadence ship.

4. **Substrate-wrapper pattern** — **PROMOTED to 2-instance ESTABLISHED** (v891 retention + v893 ceiling). Both instances confirm the shape: thin function bridging operator config to existing substrate (or pure comparison) + auto-emit. Codify in v895 counter-cadence ship.

## Forward path

**Continue v892-v895 session.** Next ships:

- v894 — Integration test for `observation.retention_days` calibration loop (option 4; verify-axis check within 10-ship budget per #10428).
- v895 — Counter-cadence codify ship (option 5; absorb 2-instance promotions + accumulated candidates).
