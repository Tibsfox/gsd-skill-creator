# v1.49.822 — Lessons

## New lesson candidates (0)

No new candidates this ship. Backlog: 0 candidates + ~10-12 tentative observations (UNCHANGED from v821).

## Lessons applied (existing)

| # | Lesson | Application |
|---|---|---|
| #10412 | Recon-first per file | Read v821 retrospective + the v821-modified step 13. Verified v821 infrastructure works (smoke-tested ceiling=30 forced-fail) before the flip. |
| #10416 | Tolerant-generator / lightest wire | Resisted removing legacy mode (backward compat); auto-tuning ceiling; vitest tests for the gate. Chose: ~10-LOC flip. |
| #10417 | Static-analysis tool authoring | Tool unchanged; gate policy flipped. Cleanly separated. |
| #10422 | Verdict-pattern surface separation | Default-BLOCK + legacy strict-mode are distinct decision surfaces; both preserved. |
| #10427 | Failure-mode contracts | Gate's failure mode: "FAIL when count > ceiling; raise the ceiling explicitly if you want to push past." |
| #10431 | Two-layer closure | v807 detector + v822 source-eliminator complete two-layer closure for the discipline-coverage drift class. |
| #10432 | KNOWN_UNWIRED-style ledger | Second instance of the ledger pattern (after KNOWN_UNWIRED itself). Generalization candidate progress. |

## Tentative observations carried forward (~10-12 — UNCHANGED from v821)

All v810-v821 tentative observations carry forward.

## New observations flagged this ship (not promoted; not in count)

**Infrastructure-then-flip is the right cadence for default-changing gates.** v821 added the threshold infrastructure as opt-in (env var). v822 flipped the default. Splitting let each ship be focused on one decision: "should the infrastructure exist?" (v821) vs "should it be the default?" (v822). Pattern: when changing a gate's default would break existing state, split into infra (opt-in) + flip (default). Tentative; 1 strong instance (this v821+v822 pair). Generalization candidate at next codify ship.

**Strict mode ⊆ ceiling mode is a clean hierarchy.** The legacy strict mode (FAIL on any UNCODIFIED) is the special case of ceiling mode where ceiling = 0. Both modes can coexist; the gate dispatches on env state. Pattern: when introducing a softer enforcement mode, the legacy strict mode becomes the strict end of the new mode's parameter space. Tentative; 1 instance.

**Buffer of 2-5 is tight-but-not-punitive.** The 2-unit buffer (39 + 2 = 41 default) absorbs near-term chain ships' tentative-observation churn without immediate failure. Larger buffers (5-10) absorb more but delay the operator's awareness of accumulation. Smaller buffers (0-1) cause immediate spurious failures on observation churn. 2-5 is the operator-pleasant range. Tentative; 1 instance.

## Cross-references

- #10431 + #10432 → two-layer closure for procedure-rooted drift + ledger-style accounting for accumulated debt. v822 completes both for the discipline-coverage domain.
- #10416 + #10422 → lightest-wire bounds per-ship scope; verdict-pattern surface separation lets the legacy + new modes coexist.

## What this ship illustrates about T2.2 closure

v821 + v822 = ~45 min total wall-clock. v784 audit predicted "2 ships." The infrastructure-then-flip pattern fit the audit's framing exactly.

Post-v822, the discipline-coverage gate is enforced. The chip-down cadence becomes operator-driven: codify a lesson → count drops → optionally lower the ceiling → repeat. The 39 UNCODIFIED lessons are now visible debt with a defined enforcement boundary; future codify ships chip them down.

After v822, the v816-822 chain has 1 ship remaining (v823 = T1.3 ObservationBridge wire). T2.2 audit wedge fully closed.
