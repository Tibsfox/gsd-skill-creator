# Retrospective — v1.49.914

## Carryover lessons applied

- **#10461 (v913 candidate — gate-enforce every suite + pair with a drift-guard)**: this ship is the second instance. v913 enforced the vitest side; v914 enforces the `node:test` side (gate step 2.7) AND closes the gate-vs-CI reach gap. Advanced 1-instance → 2-instance (still a candidate; 3-instance bar not met — see 04-lessons).
- **#10431 / #10436 (two-layer closure)**: applied again — Layer 1 is the new `tools-node-test` gate step (enforcement); Layer 2 is the exact-set `--print-node-test` drift-guard test (detection). The node:test enforcement uses dynamic discovery so the *runner* can't drift, and the exact-set test makes a new node:test file visible — the two layers together cover both rot and silent-addition.
- **#10450 (static-analysis tools must handle common shapes OR fail loudly)**: the new modes reuse the v913-hardened runner classifier rather than re-deriving it; the adversarial probe confirmed dynamic discovery classifies a fresh node:test file correctly.
- **#10417 / #10421 / #10427 (spawnSync / no-silent-caps / fail-loudly)**: `--run-node-test` uses `spawnSync` with `stdio: 'inherit'`, exits with the child's real status (load-bearing), and refuses to run an empty `node --test` (no silent no-op).

## What went unusually well

- **The two gaps were genuinely the same shape.** v913's OPENED + CARRY-FORWARD threads (CI-enforce; node:test runner) turned out to be one cluster: both are "a test surface that runs in too few places." Closing them together produced a clean, self-consistent second instance of #10461 rather than two unrelated micro-ships.
- **Single-source-of-truth discovery avoided a new drift surface.** Rather than hardcode the 2 node:test paths in both the gate and the runner, the gate calls the classifier the drift-guard already owns. There is exactly one place that knows what a node:test file is — so the node:test gate cannot drift from the node:test classification.
- **Adversarial verification earned its spend (again).** The implementation spec worried that the entrypoint refactor might silently break the default-mode FAIL path (`process.exit(undefined) ⇒ exit 0`). The adversarial reviewer disproved it by reading (the entrypoint is a dispatcher, exit stays inside `main()`) AND by live probe (a real out-of-list vitest file tripped exit 1). The recommended pattern for gate-critical tooling held its value.

## What went less well

- **Heavy tool-output buffering in the session.** Main-context Bash/Read results surfaced in large delayed batches rather than per-call, which made interactive verification slow and pushed work onto sub-agents (whose final messages render reliably). The work was correct throughout — file edits and gate runs executed as issued — but the cadence was degraded. Not a code issue; an environment note for next session.
- **A long-running implementation agent overran its budget.** The implementation sub-agent ran ~34 min / 317 tool uses (well past the ~60-70 ceiling), partly chasing the buffering and a transient `/tmp` (tmpfs) ENOSPC spike caused by concurrent agents' temp fixtures. The output was clean and the disk recovered, but the right shape for gate-critical code is a tighter, smaller-scoped dispatch.
- **Pre-existing atlas-deps-audit flake observed.** One of several full tools-suite runs showed `atlas-index-cli.test.mjs` failing via `atlas-deps-audit: FAIL — 1 violation(s)`; it passes deterministically in isolation and was green in the other runs. Independent of this ship (no atlas files touched), but a known intermittent worth a future flake-audit entry.

## Threads closed / opened / extended

**CLOSED:** the v913 OPENED thread (tools-suite gate-enforced but NOT CI-enforced) — closed by the two new CI steps. **CLOSED:** the v913 CARRY-FORWARD gap (2 `node:test` files in no gate) — closed by step 2.7 `tools-node-test` + CI step.
**EXTENDED:** candidate #10461 advanced 1-instance → 2-instance, with a new facet (gate-reach vs CI-reach: a suite enforced only at tag-time isn't caught on dev pushes).
**OPENED:** none. The tools-test enforcement cluster is now complete (gate + CI for both runners, both with drift-guards).

## Thread state

Engine state: UNCHANGED. NASA degree 1.178 (132 consecutive ships). Counter-cadence 15. No codification; no chokepoint chip; no threshold/substrate work. Pre-tag-gate 19 → 20 executable steps.
