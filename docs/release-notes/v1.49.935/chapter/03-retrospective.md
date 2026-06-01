# v1.49.935 — Retrospective

## What went right

- **Recon-first reconciled a real contradiction.** Two memory artifacts disagreed about `algebrus.eigen`: one said it is intentionally CPU-only and unit-tested-passing, the other that it errors even on a diagonal matrix. A parallel recon Workflow ran a live probe through both the Python chip and the MCP client and found both true at different layers — eigen computes correctly in-process but errors 100% through the wire (scipy returns a `complex` dtype the server can't JSON-serialize). The verdict (CF4c) and the deferred defect (CF4d) both fell out cleanly once the layers were separated.

- **The adversarial-verify Workflow caught an honesty overclaim before commit.** The first draft said the activation pipeline "pre-warms these chips so the first real tool call doesn't pay the discovery cost" — implying automatic session behavior. A skeptic lens grepped for non-test callers of `createCoprocessorStage` and found none: its only caller is `SkillApplicator.apply()`, which has zero production callers, and the shipped `invoke` CLI bypasses the pipeline. The prose was corrected everywhere to "*declared* consumer." The same pass fixed a `det`-is-GPU-accelerated error and an fp "identical values" overclaim.

- **Two-layer proof.** An always-on unit test guarantees the shipped frontmatter parses to the right chips on every CI run (no server needed); a gated live test proves the full pipeline + oracle compute when an operator opts in. The load-bearing CI guarantee and the rich local proof are cleanly separated.

- **Tightly scoped.** CF4b + CF4c shipped with zero `src/` runtime change; the genuine bug recon surfaced (the eigen wire defect) was deferred as CF4d rather than folded in, keeping the ship's blast radius at "docs + tests + one example skill."

## What to watch

- **Declared != wired.** This skill is a *declared* consumer; no production session path runs the pre-warm stage yet. A future consume ship that routes example/loaded skills through `SkillApplicator.apply()` (or wires `invoke` to the pipeline) is separate work — this test then becomes its regression guard.

- **CF4d is real and open.** `algebrus.eigen` is unusable through the typed client until the complex-serialization fix ships. It is recorded at the op site (`PACKAGE.md`) and in the campaign status doc so it is not lost.

- **macOS is load-bearing (from v928).** The new tests are pure-parse (unit) or gated-skip (live) on CI, so they add no macOS-specific risk — but confirm CI green on the pushed v935 commits, including the macOS leg, before considering the ship complete.

## Process note

The `/tmp/coproc-venv` (mcp+numpy+scipy) from a prior session was reused to drive the live probes and the gated test; CI has no such env, so the live leg stays locally-verified-only by design.
