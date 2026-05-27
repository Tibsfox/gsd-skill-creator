# v1.49.838 — Lessons

## New lesson candidate (1 instance, possibly 2 — see below)

### Bidirectional enforcement completeness (1 instance, classification ambiguous)

**Status:** 1 distinct instance at v838 close. Classification ambiguous: this may be the same class as v836's "Two-layer closure generalization" (#10431 sub-pattern) — both are "drift can happen at either end; bidirectional check closes it."

**Provisional scope:**

Any cross-cutting audit or preservation surface that maintains an allowlist or destination-side state needs BOTH a forward check AND an inverse check:

- **Forward check:** out-of-allowlist items must conform to the discipline. Catches MISSING wires / overwrites / etc.
- **Inverse check:** in-allowlist items must NOT conform. Catches STALE allowlist entries / mismatched assumptions.

Either direction alone is incomplete. The forward-only audit (v806's initial shape) catches new misses but lets stale entries drift indefinitely. The v834 case study (22-ship-old off-by-one) is the cost of forward-only enforcement.

**Two known instances:**

1. v1.49.836 — file-preservation bidirectionality: `chapter.mjs` C04 (source-side preservation, from v585) + `publish.mjs` `shouldPublishToDestination` (destination-side preservation, v836).
2. v1.49.838 — audit-enforcement bidirectionality: forward check (out-of-allowlist file must conform) + inverse check (in-allowlist file must NOT conform).

**The question for the codify ship:** are these two instances of the SAME class (bidirectional discipline) or sibling instances of TWO classes (preservation bidirectionality + audit bidirectionality)? The codify ship can disambiguate by inspecting whether the discipline doc `docs/two-layer-closure-discipline.md` covers both naturally OR needs separate paragraphs.

**Evidence anchors:**
- v836 release notes Layer 1/2 description in `docs/release-notes/v1.49.836/README.md`.
- v838 audit-test inverse check in `src/security/process-context-audit.test.ts` + `src/security/egress-context-audit.test.ts`.

**Candidate-for-3rd-instance triggers:** any future cross-cutting discipline where the existing enforcement is unidirectional and a manual catch surfaces the missing inverse. If a 3rd instance appears, the cross-class generalization becomes load-bearing for codification.

## Forward-test of existing lessons

### #10434 — Cross-cutting observability+enforcement surface (KNOWN_UNWIRED ledger discipline)

**Status:** RESPECTED + EXTENDED. The v814 discipline doc explicitly forward-flagged "inverse check is a future enhancement." v838 lands the enhancement. The audit-test enforcement is now bidirectional for the chokepoint families that maintain `KNOWN_UNWIRED`: ProcessContext and EgressContext. LoaderContext has no allowlist and is therefore exempt by construction.

### #10431 — Two-layer closure for procedure-rooted drift

**Status:** RESPECTED + GENERALIZED. v813 closed STATE.md procedure-rooted drift via source-eliminator + detector. v836 generalized to file-overwrite drift via source-side preservation + destination-side preservation. v838 generalizes again to audit-enforcement drift via forward check + inverse check. The shape is recognizable across procedural, file-state, and audit-enforcement classes.

### #10427 — Failure-mode contracts

**Status:** RESPECTED. The new gate fails LOUDLY when stale entries are detected (throws with a multi-line error listing all stale paths). Load-bearing surface; the operator's next action depends on this surface's output (remove stale entries from the allowlist). Matches the discipline.

### #10416 — Lightest wire

**Status:** RESPECTED. Two new `it` blocks (~25 LOC each); no refactor of the existing audit-test structure; no new helper modules.

### #10422 — Ledger-driven work

**Status:** RESPECTED. Per-file recon:
1. Read `process-context-audit.test.ts` to find the test-block structure.
2. Read `egress-context-audit.test.ts` to confirm the same `KNOWN_UNWIRED` pattern.
3. Read `loader-context-audit.test.ts` and discover no `KNOWN_UNWIRED` exists — N/A for the inverse-check pattern.
4. Verify the regex names match what the inverse check needs (`ENSURE_PROCESS_ALLOWED_REGEX`, `ENSURE_EGRESS_ALLOWED_REGEX`).
5. Implement + run tests; verify both inverse-checks PASS at v838 ship time.

## Status of v837 lesson candidates

- **Polarity convention for calibratable thresholds in different mechanic classes** (1 instance: v803 vs v837): UNCHANGED at 1 instance. v838 is an audit ship, not a calibration ship.

## Status of v836 lesson candidates

- **Two-layer closure generalization (#10431 sub-pattern)** (2 instances at v836 close): Now potentially 3 instances (v813 + v836 + v838) if v838's audit-bidirectionality counts as the same class. Codify-ship-eligibility threshold remains met regardless.
- **Auto-run-on-import as a hidden bootstrap-time tax** (1 instance: v836): UNCHANGED at 1 instance.

## Status of v834-835 lesson candidates

- **Audit-inverse-check enhancement** (1 forward-flag at v834 close): **CLOSED v838.** The flag motivated the implementation; the implementation is now permanent gate infrastructure. The flag itself converts from "operator-bounded ~30-min future ship" to "completed v838."
- Other v834-835 candidates: UNCHANGED.

## Codify ship eligibility at v838 close

| Observation | Instances | Codify-eligible? |
|---|---|---|
| Two-layer closure generalization (#10431 sub-pattern) | 2 or 3 (v813 + v836 + [v838?]) | YES (regardless of v838 inclusion) |
| Bidirectional enforcement completeness | 1 (or 2 if v836 counted separately) | DEFERRED (wait for explicit 2nd instance) |
| Substrate-consumer hook PAIR pattern | 2 (v830 + v832) | YES (carryover) |
| `onPredictions` substrate-consumer wire | 2 (v810 + v826) | YES (carryover) |
| #10433 LOC-band-by-callsite-count refinement | 3 (v825 + v827 + v828) | YES (carryover) |
| Verification/integration-only ships | 2 (v829 + v832) | YES (carryover) |

**5+ eligible patterns** for the next codify ship (likely v840+). Codify cadence: 5 ships past last codify (v833) — within the 7-10 ship floor, no urgency.
