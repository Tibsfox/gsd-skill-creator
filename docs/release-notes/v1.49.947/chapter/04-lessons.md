# v1.49.947 — Lessons

No new manifest lesson is promoted this ship (manifest stays **151**). This counter-cadence ship **realizes** the meta-cadence forward-shadow and **applies** existing lessons.

## Applied (existing lessons)

- **#10428 — meta-cadence (gate-not-vigilance).** The four-axis overdue check was prose-only and was misapplied twice in one session. Per the counter-cadence discipline — convert an offending rule into a gate, not a re-emphasized prose rule — this ship encodes the first-conjunct check as `skill-creator cadence`. The doc's forward-shadow ("a future ship could encode each axis's overdue trigger as a CLI subcommand") is now realized.
- **#10461 — gate-enforce-every-runnable-surface + drift-guard pairing.** The new runtime `ALL_CALIBRATABLE_THRESHOLDS` array mirrors the compile-time-only `CalibratableThreshold` union. The pairing is pinned BOTH directions at build time: `as const satisfies readonly CalibratableThreshold[]` (Layer-2 reference-data check — rejects a non-member) + a `_AllThresholdsCovered` conditional-type assertion (fails to compile if a union member is missing from the array). Mutation-proven (TS2322 on a dropped member).
- **#10427 — failure-mode contracts (honest verdicts).** The tool reports `manual` for codify and labels verify a heuristic rather than faking a definitive verdict; and it reports `candidate` (not silent "overdue") when only the first conjunct is machine-determinable. A gate that claimed certainty on partial evidence would be the silent-failure anti-pattern in a new dress.
- **#10409 — recon precedes code.** The consume axis encodes the trigger's INTENT (iterate real union members) rather than its surface string (`grep wired:false`), which is exactly what produced the v944 false positive. Reading the prose trigger against `observation-sources.ts` before encoding it was load-bearing.

## Carried-forward candidate (observed, not promoted)

- **Deterministic FIRST-CONJUNCT surface + operator-tracked SECOND conjunct.** When a discipline's trigger is conjunctive and only one conjunct is machine-readable, the honest tool shape is: compute the machine-readable conjunct deterministically, report `candidate` (not a definitive verdict) when it is met, and hand the un-trackable conjunct back to the operator with an explicit note. This is the shape the cadence CLI used for all four axes. **One instance.** Promote if a second conjunctive-trigger tool adopts the same first-conjunct/second-conjunct split (a sibling of the #10464 defer-biased-gate pattern, where only one Set advances the gate).

## Process note

- **A counter-cadence tool ship still runs the full ship discipline.** Recon-first (#10409, which kept the consume axis honest), a pure-function extraction for testability, two mutation-proofs (runtime conjunct + compile-time drift guard), a `feat` code commit then a separate `chore(release)`, the discipline doc updated from forward-shadow to realized, five chapters, STORY, bump, full 18-step pre-tag-gate, tag, dual-push with `ls-remote` verification, RH refresh/publish, STATE with `--counter-cadence` (this ship IS #24) + `--predecessor` v1.49.946 (NOT counter-cadence), CI verified per-job on macOS + cargo + Security-Audit for both commits.
