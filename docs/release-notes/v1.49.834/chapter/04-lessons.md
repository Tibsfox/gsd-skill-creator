# v1.49.834 — Lessons

## New lesson candidates (1, deferred)

### Stale-entry cleanup chip pattern

**Status:** 1 instance (this ship). NOT codified. Wait for 2nd instance before codifying per #10426.

**Provisional scope:** When a chokepoint or audit allowlist (`KNOWN_UNWIRED` and similar) is consulted via short-circuit BEFORE the audit's actual conformance check, a stale allowlist entry can hide a real wire silently. Per-ship recon catches it; the audit itself does not. The "stale-entry cleanup chip" is the per-ship recon-catch shape — structurally different from a wire-adding chip (no source-code wire change; just an allowlist edit).

**Provisional pattern (1 instance):**
1. Recon reveals a file in `KNOWN_UNWIRED` that ALSO calls `ensureXAllowed`.
2. Edit: remove the allowlist entry; add inline comment explaining when the wire was added (in this case v812) and why the allowlist edit was missed.
3. Verify: audit-test re-runs cleanly (the wire was already in place; removing the allowlist entry just stops the short-circuit and lets the real wire be checked).
4. Release-notes: report the actual count after the edit; if a prior off-by-one had been silently propagating, surface the count-claim history.

**Evidence anchor:** v1.49.834 (this ship) — `src/intelligence/analyzer/git.ts` removed from ProcessContext KNOWN_UNWIRED; was already wired at v1.49.812 but v812 missed the allowlist edit.

**Candidate-for-2nd-instance triggers:** any future recon-discovered stale entry in EgressContext / LoaderContext / ProcessContext / future-chokepoint KNOWN_UNWIRED allowlists.

## Forward-test of existing lessons

### #10416 — Lightest wire

**Status:** RESPECTED. ~9 LOC change (1 line removed + 7-line comment added) closes the gap. Zero source-code wiring (the wire was added 22 ships ago at v812); zero test additions (the audit already tested the actual wire, just via a different path).

### #10426 — Second-instance threshold

**Status:** RESPECTED. The stale-entry cleanup chip pattern is at 1 instance; deferred. Carry-forward observation logged.

### #10428 — Meta-cadence

**Status:** consume-axis tick. Last consume-axis chip was v828 (6 ships ago). Within the ≤6-ship floor. v834 takes the consume-axis cadence to 0-ships-ago.

### #10432 — KNOWN_UNWIRED ledger

**Status:** EXERCISED. This is the first time the per-ship release-notes discipline (predicted at v814 codification as the mitigation for the unidirectional asymmetry) actually catches a stale entry. The doc's prediction held: "the per-ship release-notes discipline catches it manually at chip cadence." Gap-to-catch was 22 ships — wider than typical, but within the doc's "not urgent" framing.

### #10433 — Internal-helper pattern

**Status:** NOT EXERCISED. No new wires this ship; the existing wire at v812 already uses the hoisted-check pattern (#10427) for `execFileAsync`. The LOC-band refinement to #10433 remains DEFERRED to next codify ship.

### #10434 — Discipline coverage ratchet

**Status:** UNCODIFIED unchanged at 39 (≤ ceiling 41). No new manifest entries this ship; the 1-instance stale-entry cleanup chip pattern is carry-forward, not codified. Ratchet ledger holds.

### #10427 — Failure-mode contracts

**Status:** RESPECTED IN VERIFICATION. The wire at v812 was authored with `ensureProcessAllowed` hoisted OUTSIDE the swallow-everything catch — the canonical #10427 shape. v834 verifies this by spot-reading `src/intelligence/analyzer/git.ts:67-71` during recon. The 22-ship-old wire was correctly structured; only the allowlist edit was missing.

## Tentative observations (carried forward)

Inherited from v833 close (no change):
- **Substrate-consumer hook PAIR pattern** (2 instances: v830 + v832) — DEFERRED.
- **`onPredictions` substrate-consumer wire pattern** (2 instances: v810 + v826) — DEFERRED.
- **#10433 LOC-band-by-callsite-count refinement** (3 instances: v825 + v827 + v828) — DEFERRED.
- **Verification/integration-only ships** (2 instances: v829 + v832) — DEFERRED.

NEW this ship:
- **Stale-entry cleanup chip pattern** (1 instance: v834) — DEFERRED. Wait for 2nd.
- **Per-ship release-notes count claims inherit predecessor without source-of-truth re-derivation** (1 instance: v812 → v828 silent off-by-one through ~6 chip ships) — DEFERRED. Wait for 2nd to motivate a pre-tag-gate count-diff check.
- **Audit-inverse-check enhancement as defensive measure** (1 forward-flag, not yet acted on) — operator-bounded ~30 min ship.

## Cadence observation

v834 is the first **non-arc chip ship** since the v827-829 chain — pure consume-axis tick with no chain context. The v830-833 chain closed with v833 codify; v834 opens a clean post-chain ship without chain coordination overhead. This shape (small isolated chip after chain close) is the "default cadence ship" the v833 forward-path described.

Pairs thematically with the next planned ship v835 (lowConfidenceThreshold calibration scaffold). Both close gaps that the audit/calibration framework didn't enforce: v834 closes a stale-allowlist gap; v835 closes a missing-threshold-registration gap.
