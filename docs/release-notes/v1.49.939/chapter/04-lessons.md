# v1.49.939 — Lessons

No new manifest lesson. This ship applies already-codified disciplines.

- **#10463 (staged CI-lane promotion) + #10428 (gate-not-vigilance)** — the cargo lane's flip was driven by the deterministic READY verdict of `tools/ci/cargo-flip-readiness.mjs`, not operator judgment. Second lane to complete the staged→load-bearing arc (after macOS v1.49.928); cargo's is a two-rung sequence (staged v936 → load-bearing v939) vs the macOS three-rung (v920→v923→v928).
- **#10461 (gate-enforce-every-runnable-surface + drift-guard pairing)** — the flip (deleting `continue-on-error` in ci.yml) was paired in one commit with the inversion of the STAGED assertion in `ci-matrix-parity.test.ts` to pin the line's absence. Mutation-proven: re-adding the line reds the inverted assertion. Neither the lane's blocking status nor its guard can drift silently from the other.
- **#10427 (failure-mode contracts: silent-vs-loud / no stale self-referential guidance)** — the gate's runtime guidance was lifecycle-aware from the start (reads ci.yml, switches to the REVERT path post-flip); the two docstring comments that called the flip "future" were updated to past tense so the tool's own docs don't describe a done flip as pending.

## Carried-forward observation candidates (unchanged from v1.49.938)

- **A staged-lane flip-readiness gate's counting model must match the lane's FAILURE MODE.** macOS = organic-churn (cross-platform behavioral divergence on new code; docs/release re-runs are inert); cargo = lane-stability (full recompile every push; docs-only greens count; only lane-definition edits are excluded). Two instances now exist of "a flip gate," but only one instance of the *divergence itself*; a third staged lane that again needs a failure-mode-specific model would promote this.
- **Pin the GREEN/BREAKING set boundaries of a defer-biased gate.** Surfaced at v1.49.938 by the adversarial-verify (a tracked `timed_out`/`cancelled` could fall through to transparent and advance the flip; `neutral` could count as green). Mutation-proven boundary tests closed it. The same gap may exist in the macOS sibling's suite — worth a sweep if a third gate is built.
