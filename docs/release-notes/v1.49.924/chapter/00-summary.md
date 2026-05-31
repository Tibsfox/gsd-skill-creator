# v1.49.924 — Summary

**Counter-cadence ship #19.** A single-deliverable codification ship. No NASA degree advance (holds at 1.178, 139 consecutive ships). Drains carry-forward #2 from the v1.49.923 handoff: codify the staged-matrix-promotion lesson the v923 ship recorded as a candidate.

## The deliverable

### Codified lesson #10463 — staged CI-lane promotion via a non-blocking matrix leg

v1.49.923 promoted the macOS CI lane from a decoupled nightly workflow into the ship-blocking `ci.yml` test matrix as a **non-blocking** leg (`continue-on-error: ${{ matrix.os == 'macos-latest' }}` + `fail-fast: false`). That ship recorded the underlying pattern as a lesson candidate but deferred manifest codification to a codify-axis ship (v923 was a CI-infrastructure ship, not a codify ship). This ship does the codification.

The pattern: a non-blocking matrix leg is the **intermediate rung** between a decoupled-nightly lane (safe but blind — no per-push signal) and a load-bearing one (per-push signal but able to block a ship). The staged leg runs on every push — immediate red-X signal — while the run-level conclusion the ship gate reads stays unaffected by the new leg, so an unproven lane cannot block a release.

Two load-bearing facts travel with the lesson:

1. **Empirical GitHub-Actions masking fact (verified, not assumed).** A job-level `continue-on-error` matrix leg that FAILS still yields a run-level conclusion of `success` — UNLESS a `needs: [<job>]` downstream job consumes the deceptive per-leg success, in which case that downstream can fail the run. This repo's `ci.yml` jobs are independent, so the masking is clean. The v923 ship settled this with an isolated throwaway-branch probe after an adversarial review put a *sourced* blocker on the assumption.
2. **The drift-guard is the enforcement (sibling of #10461).** `tests/integration/ci-matrix-parity.test.ts` pins the matrix shape, the staged property, and the retired lane's absence — so the load-bearing flip (deleting `continue-on-error`) is forced to be a deliberate act that also updates the test. A silent flip fails CI.

Codified in `docs/static-analysis-tool-discipline.md` (the lesson's enforcement is a structural drift-guard, squarely in that domain's "drift checkers" scope) and registered as #10463 in the manifest, sibling-cross-referenced to #10428 (meta-cadence) and #10461 (gate-enforce-every-runnable-surface).

## Result

Render-claude-md no-drift; discipline-coverage UNCODIFIED 0 / PARTIAL 0; manifest lessons 149 → 150; tools suite 698 green (unchanged). Carry-forward #1 (the load-bearing flip) remains open, pending a green macOS track record across organic development churn.
