# v1.49.875 — Lessons (Track 4 CLOSE)

## Promoted to ESTABLISHED in this ship (0)

Track 4 close ship. No new promotions; the promotion-eligible candidates accumulated across Track 4 will land at the next codify ship.

## Sustained observations

### #10433 — Internal-helper / hoist-at-top variants

**Status:** SUSTAINED. v875 applies hoist-at-top variant on a 1440 LOC file with N=1 spawn site. Track 4 close exercised 5 distinct variants across 6 chips: class-private-method (v870), closure-capture (v871), hoist-at-top (v872, v875), module-internal-helper (v873), safeExecFile wrapper (v874).

### #10427 — Failure-mode contracts

**Status:** SUSTAINED + DECISIVELY PROMOTION-ELIGIBLE. Track 4 cumulative re-throw count: 24 across 5 chips (v870: 5, v871: 4, v873: 11, v874: 3, v875: 1; v872 had no swallow-catches). Next codify ship should consider a helper or higher-order pattern.

### #10444 — Size-ascending chip-pick reveals wire-shape diversity

**Status:** SUSTAINED + REFINEMENT-ELIGIBLE. v875's 1440-LOC-with-N=1-spawn case is the 2nd counter-example confirming v872's forward-observation: spawn-site count is more predictive than LOC band.

## Forward observations (now PROMOTION-ELIGIBLE)

### Spawn-site count as primary wire-shape predictor (PROMOTION-ELIGIBLE — 2 instances)

**Surface ships:** v1.49.872 (311 LOC, N=1, hoist-at-top) + v1.49.875 (1440 LOC, N=1, hoist-at-top).

The #10444 catalog uses LOC bands as the primary predictor; both v872 and v875 are counter-examples. Refinement at next codify: **spawn-site count is the more precise primary axis; LOC is the secondary axis** (correlated with site count but not deterministic). Small-LOC with many sites → internal-helper; large-LOC with one site → hoist-at-top.

### #10427 multi-catch helper (PROMOTION-ELIGIBLE — 5 instances, 24 total re-throws)

**Surface ships:** v870 (5) + v871 (4) + v873 (11) + v874 (3) + v875 (1).

24 mechanical re-throws across 5 chips. Codification-ready. Two proposed shapes:
1. Inline helper: `function rethrowIfDenied(err: unknown): void { if (err instanceof ProcessContextDenied) throw err; }`
2. Higher-order wrapper: `await callOrRethrowDenial(asyncFn)`

Recommendation: ship the inline helper (lower risk; 1-line call sites). The higher-order wrapper can be added later if needed.

### Track-close codify-ship hint

**Surface ship:** v1.49.875 (Track 4 close).

When a chip cluster closes (ratchet ledger drains to 0), the next codify ship should evaluate the cluster's accumulated forward-observations as a batch. v875 closes Track 4 with 5+ promotion-eligible candidates accumulated across the 6 chips. The cluster's worth of evidence is denser than the per-ship observations would suggest.

Below threshold (1 instance — v875 Track 4 close). Track 5 will close at v881; if the same cluster-end codify-evaluation discipline holds, that's the 2nd instance.

## Carry-forward candidates from prior ships

- Audit target accuracy: execFile vs shell-exec (from v874) — promotion-eligible at 2 instances.
- safeExecFile-wrapper pattern (from v874) — 1 instance; carry forward.
- Module-internal-helper variant (from v873) — promotion candidate with v874's safeExecFile variant.
- Closure-capture vs internal-helper-method same pattern (from v871) — still applicable.
