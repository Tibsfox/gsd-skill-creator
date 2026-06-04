# v1.49.966 — Lessons

No new manifest lesson is promoted (manifest stays at 151). This ship applies
several existing lessons to a freshly-surfaced instance and hardens one
process-learning into a permanent gate.

## Applied (existing lessons)

- **#10461 (gate-enforce-every-runnable-surface + drift-guard pairing).** All
  three findings are #10461-class: a surface (the gate's own printed output, its
  exit-code legend, its exit-code allocation) had silently drifted from reality.
  Each fix is paired with a Layer-2 drift-guard in
  `pre-tag-gate-self-consistency.test.ts`, run on every ship by the root vitest
  project — a sibling of `bypass-vocab-parity.test.ts` (v962).
- **#10427 (failure-mode contracts).** The corrected legend distinguishes the
  load-bearing default-BLOCK steps (exit 15 discipline-coverage, exit 19
  project-md) from the genuinely WARN-only ones (10/13/14/16/23). The test pins
  both directions so a future step that gains a ceiling-BLOCK path must update the
  legend.
- **#10409 (per-file recon precedes per-file code).** Mapping each exit code to its
  emitting block before editing is what exposed the exit-21 collision and the two
  inaccurate legend entries; a straight cosmetic edit would have shipped the bug.
- **#10431 / #10436 (two-layer closure).** The drift-guard is the detector; the
  normalization + reassignment are the source fix. Either alone re-rots — a
  corrected legend with no guard drifts again at the next step-addition.

## Process notes

- **Verify exit-code uniqueness by FULL enumeration — now a gate, not a habit.**
  The v961 author believed exit 21 was "unused" (the v961 meta-test literally
  commented it so) but had skipped enumerating the existing codes; tools-suite had
  owned 21 since v913. This ship converts the post-v965 process-learning into a
  permanent assertion: the legend has no duplicate code, and the emitted non-zero
  codes equal the documented set exactly.
- **A reassignment is not complete until every reference moves.** The 21→24 change
  had to reach the code path, the legend entry, an inline explanatory *comment*
  (found only by enumerating non-line-start `exit` mentions), and the v961
  meta-test's wrong belief. The targeted edits missed the comment; the audit found
  it.
- **Review a preservation/parser tool against its adversarial input.** The new
  guard's emitted-code parser was whitespace-fragile; the adversarial review's
  drift-guard-soundness lens caught it before push.
