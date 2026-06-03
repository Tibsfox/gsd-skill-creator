# v1.49.953 — Lessons

No new manifest lesson is promoted this ship (manifest stays **151**). This `feat` applies one existing lesson and records one carried-forward candidate.

## Applied (existing lessons)

- **#10461 — gate-enforce-every-runnable-surface + drift-guard pairing.** The structural detector's one fragile input — the `SUBSTRATE_MODULE_RE` naming pattern — is paired with a live-tree drift guard: the "verify axis (live repo)" test asserts every wired threshold is structurally wired against the real `tests/integration/` directory. So a future substrate whose module naming falls outside the pattern (reference-data staleness) fails the guard at its introducing ship, forcing the pattern to track disk reality. Layer 1 (the detector runs in the gated suite every ship) + Layer 2 (the drift guard pins the real-file set) — the #10461 shape.

## Carried-forward candidate (observed, not promoted)

- **A coverage/quality gate built on string-presence should harden to call-with-literal before claiming "wire detection."** A gate that judges "X is covered" by `content.includes('X')` is satisfied by any mention — a comment, a doc string, a variable name. The minimal honest hardening is to require X to appear in a load-bearing SYNTACTIC POSITION (here: a string-literal argument to the real consumer call), which a mention cannot satisfy. The further hardening (verify BOTH ends of the wire) needs a per-domain notion of the "other end" (here: a substrate-module import pattern). **One instance** (cadence verify axis: string-presence v947/950 -> dedicated-file v949 -> call-with-literal + substrate-import v953). Promote if a second presence-based quality gate is hardened to syntactic-position detection for the same reason (sibling of the static-analysis-tool-discipline "handle code-shape variants or fail loudly").

## Process notes

- **A stricter detector's first obligation is no-regression against the real tree.** Before tightening "covered," the new detector was checked against the actual call style and import paths of all five dedicated end-to-end files — especially the multi-line `loadObservationsForThreshold(\n  'threshold',` style, which the `\s*` in the regex must span. The verdict had to stay `not-overdue`; a stricter detector that flipped a real wire to uncovered would have been a regression dressed as a hardening.

- **Harden the meaning, not the verdict.** The live verify verdict was `not-overdue` before and after — the ship raised the bar for what "covered" requires without moving the result. That is the signature of a detector improvement (vs a coverage advance): the coverage was already real; only the detection was weak. It self-tags no axis advance accordingly.
