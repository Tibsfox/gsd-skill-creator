# v1.49.923 — Retrospective

## What went well

- **The adversarial review earned its keep — by being wrong, loudly.** A semantics skeptic
  put a sourced BLOCKER on the core design (job-level `continue-on-error` "doesn't mask the
  run conclusion"). Rather than accept or dismiss it, the dispute was resolved against ground
  truth: the cited "workflow still fails" case requires a `needs: [test]` downstream job (this
  repo has none), and an isolated throwaway-branch probe proved the masking empirically. A
  plausible-but-wrong blocker, caught and closed with evidence, not argument.

- **The staged rung was the right call.** Folding macOS straight into a load-bearing matrix
  leg would have made a three-day-old lane (zero scheduled nightlies, two greens after two
  reds) able to block ships at T14. `continue-on-error` gives the per-push signal now and keeps
  the load-bearing flip a deliberate, track-record-gated future act.

- **The matrix made parity structural.** The old two-file guard had to derive the Linux command
  set and assert each command was mirrored on the macOS lane. With one job definition over an
  OS matrix, both legs run identical steps by construction — the drift-guard shrinks to pinning
  the matrix shape + the non-blocking property + retirement, and a whole class of two-file drift
  becomes impossible.

- **No gate edit needed.** The v922 ci-gate `--workflow ci.yml` pin already names the
  ship-blocking workflow; folding macOS into it inherits the pin for free. The
  `SC_CI_GATE_WORKFLOW` knob v922 added "to ease the matrix transition" did exactly that.

## What was tricky

- **The run-level vs job-level conclusion distinction is the whole design.** The ci-gate reads
  the RUN-level conclusion; `continue-on-error` operates at the JOB level. The secondary
  sources the skeptic cited conflated these with the `needs:`-downstream case. Only an isolated
  probe — a passing blocking leg + a failing continue-on-error leg, reading the actual
  `gh run list --json conclusion` — disambiguated it cleanly.

- **Proving non-blocking requires a failure you don't want on dev.** The real shipped run has
  macOS passing, which doesn't exercise the masking path. The throwaway-branch probe existed
  precisely to fail a leg on purpose and read the conclusion, without polluting dev's history
  or the macOS track record.

## Forward

- **The flip to load-bearing** is the next rung: after N consecutive green macOS pushes, delete
  the `continue-on-error` line and update `ci-matrix-parity.test.ts`. The drift-guard forces
  that pairing.
- **Lesson candidate noted** (04-lessons), deferred to codify cadence: the staged-promotion
  pattern + the empirically-established GitHub-Actions semantics fact.
- **Open follow-ons (unchanged):** Rust-in-CI; a real `coprocessor:` skill consumer;
  `algebrus.eigen` Python error.
