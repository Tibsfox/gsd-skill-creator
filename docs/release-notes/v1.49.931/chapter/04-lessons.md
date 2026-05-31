# v1.49.931 — Lessons

No new manifest lesson. This ship is a consume-axis instance of an already-codified
discipline:

- **#10428 (meta-cadence — consume axis)** — a dormant substrate (the v1.49.927
  in-branch stochastic selector path) gets its first production caller within the
  consume-axis budget (≤6 ships from substrate to first non-test caller; v927→v931
  is 4). `selectBranchVariant()` is that caller. The default activation path stays
  byte-identical (SC-MA3-01), so the wire adds a capability without moving existing
  behaviour.

## Reinforced (carried-forward, not yet promoted)

- **Sound composition site over forced wire (from v1.49.929).** The carry-forward's
  literal phrasing ("wire into the exploration flow") would have distorted
  `explore()`'s single-branch contract. The sound move was a separate M4 primitive
  that `explore()` optionally consumes — the wire lives where the gate's intended
  consumer naturally sits (an M4 branch frame is the sanctioned home for
  `inBranchContext: true`).

- **Behavioural load-bearing assertion over structural.** Assert the observable
  consequence (stochastic spread of winners under a flag) rather than the call
  shape. A structural assertion survives the mutation that matters; the behavioural
  one does not.

- **Re-verify fabricated tool reads against ground truth.** A `Read` returned an
  implausible `writeManifest` body; `awk`/`grep` confirmed the real one. Load-bearing
  API facts were re-checked before use (session harness-corruption discipline).

## Carried-forward observation candidate

- **First-production-caller-of-a-frame-gated-path.** Two arcs now share the shape
  "substrate is gated on a frame/context flag that live code can't set; the first
  caller is the frame's own primitive": concept-fallback (v830/832 callers, v929
  proof) and the in-branch stochastic path (v927 substrate, v931 caller). A third
  instance would promote this to its own consume-axis sub-lesson under #10428.
