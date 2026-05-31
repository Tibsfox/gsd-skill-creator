# v1.49.931 — Retrospective

## What went well

- **Recon found the genuine gap before designing.** Reading `selector.ts`,
  `selector-bridge.ts`, and `explore.ts` established that (a) the stochastic
  promotion is gated on `inBranchContext: true`, (b) no production code sets that
  flag (the v927 skill-applicator caller runs live → always false), and (c)
  `explore()` had no candidate-selection decision point at all. That triangulation
  defined the sound wire: a new M4 primitive that legitimately sets the flag.

- **The load-bearing assertion is behavioural, not structural.** Rather than assert
  "the code calls select with inBranchContext:true" (which a refactor could satisfy
  while breaking behaviour), the test asserts the *observable consequence*: flag-on
  spreads winners across 40 seeds, flag-off yields one. That spread is impossible
  unless the in-branch promotion actually fires — so the test fails under the
  obvious mutation (forcing the flag false).

- **Backward-compatibility kept the blast radius at zero.** `variantSelection` is
  optional; the default `explore()` path still reads `skill.md` byte-for-byte. The
  235-test regression run across branches + selector + stochastic confirmed no
  existing behaviour moved.

- **Reused the established seeded-reproducibility pattern.** The v927
  selector-stochastic unit test already proved seed→reproducible at the bridge
  level; this ship mirrors that pattern one layer up (per-branch seed →
  reproducible variant choice), so the new test reads as a sibling of the existing
  one.

## What was tricky

- **Picking a sound composition site.** The carry-forward said "wire into a real M4
  branch/exploration flow," but `explore()` runs a single fixed branch — overloading
  it with multi-candidate selection risked distorting its clean contract. The
  resolution was a separate primitive (`selectBranchVariant`) that `explore()`
  *optionally* consumes, rather than rewriting `explore()`'s core loop. The primitive
  stands on its own as the M4 peer of fork/commit/abort/gc.

- **A fabricated tool read.** A `Read` of `fork.ts`'s `writeManifest` returned an
  implausible body (`writeManifest_impl`); cross-checking with `awk` showed the real
  impl is an ordinary JSON writer. Per the session's harness-corruption discipline,
  every load-bearing API fact was re-verified with `grep`/`awk` ground truth before
  use.

## Follow-up surfaced

- **First-production-caller-of-a-frame-gated-path** is a recurring shape (v927
  substrate → v931 caller, mirroring the concept-fallback substrate → caller arc).
  If a second frame-gated path gets its first caller this way, the pattern is a
  manifest-lesson candidate (consume-axis sub-pattern of #10428).

## What to watch

- **macOS is load-bearing (from v928).** This ship touches `src/` (the branches
  module) but only adds an opt-in path; the default path is unchanged. Confirm CI
  green on the pushed commits.
