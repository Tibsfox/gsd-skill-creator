# v1.49.893 — Lessons

## Lessons emitted this ship

**None new.** All design decisions reused established patterns:

- **#10439** (CLI manual + substrate auto-emit duality) — applied (3rd instance, after v846 predictive + v891 retention). The duality is now closed for `token_budget.max_percent`: CLI manual recorder at v888 + substrate auto-emit at v893. The 3-ship-per-threshold staging discipline holds (registration v798 + CLI manual v888 + substrate auto-emit v893).
- **#10437** (subscriber-gated observability-only context-hook pattern) — applied. Fire-and-forget Promise with `.catch(() => {})` swallow; polarity derived from comparison rather than fixed default.
- **#10427** (failure-mode contracts) — applied. Inline docstring marker on the auto-emit's fire-and-forget contract + paired explicit test asserting failure doesn't propagate.
- **#10451** (calibrate-axis read-side wire recipe) — applied. v893 closes the substrate-write half that #10451's recipe steps 1-7 enabled; this is the 3rd write-side wire after v846 + v891.

## Promoted this ship (1-instance → 2-instance ESTABLISHED candidates)

1. **Substrate-wrapper pattern for calibratable threshold + existing substrate (or pure comparison)** — **promoted 1→2** (v891 + v893). Thin `runX` function bridging operator config to substrate + auto-emit. Codify in v895 counter-cadence ship.
2. **Fire-and-forget test-side wait via `setTimeout(50ms)`** — **promoted 1→2** (v891 + v893). When asserting on fire-and-forget I/O, use real timeout not setImmediate. Codify in v895.

## Promotion-eligible candidates (new this ship)

1. **Substrate-wrapper pattern: outcome-driven vs default-fixed sub-variants** (1 instance v893). The pattern has two sub-shapes — discriminator is "does the substrate's natural output determine polarity?" Promotion-eligible at 2nd outcome-driven instance.
2. **Fire-and-forget test limitation** (sibling 1 instance v891 + 1 instance v893). Tests can't reliably trigger the failure-path; the `.catch` swallow is the structural protection. Promotion-eligible at 2nd EXPLICIT instance.

## Promotion-eligible candidates (carry-forward)

3. **Default-kind selection discipline when CLI default doesn't exist** (1 instance v891). For calibratable thresholds whose CLI requires --kind, substrate auto-emit must pick a default; the discipline is "conservative bias + document rationale + pin via test." Cross-references the new outcome-driven sub-variant (this ship's #1 candidate).
4. **Two-site hoisted-check sub-variant of #10448** (1 instance v892).
5. **Audit-record-count test for two-site shapes** (1 instance v892).
6. Read-side-only chokepoint at write-bearing classes (1 instance v890).
7. `opts.ctx` vs separate ctx parameter (1 instance v889).
8. `audit-log.test.ts` assertion-flip step (1 instance v888).
9. `module-singleton` wire shape (1 instance v881).
10. Audit-fidelity inline-literal extraction (1 instance v872).
11. Fake-fixture test pattern (3 instances).
12. `git stash` cross-branch hazard (1 instance v883 session).
13. Codify-ship duration scales with composition (5 data points).
14. Cross-audit tool sanity-fixture coverage (1 instance v885).
