# v1.49.981 — Summary

## The ship

Ship 5.1c flips `observation.mine_active_skills` ON by default and lowers the co-activation → agent-suggestion thresholds so the learning loop wired in 5.1 can start collecting real signal and, once a skill pair recurs, surface a suggestion. A recon pass first established the honest framing: at current data volume no suggestion surfaces yet, so 5.1c "starts the clock" rather than shipping a working suggester.

## What shipped

- **Flag flip:** `observation.mine_active_skills` default `false` → `true`, synced across the schema field default, the composite fallback literal, and both install templates (`gsd-init.ts`, `install.cjs`). OFF path byte-identical; opt-out via explicit `false`.
- **Bootstrap thresholds (manager layer only):** `BOOTSTRAP_COACTIVATION_CONFIG` (`minCoActivations: 2`, `recencyDays: 30`) + `BOOTSTRAP_CLUSTER_CONFIG` (`minCoActivations: 2`) threaded via two new optional `Partial<Config>` ctor args. Both `minCoActivations` knobs lowered together (net gate = 2). Shared `DEFAULT_*_CONFIG` untouched, so other consumers are unaffected. `stabilityDays` left as-is (not a filter gate).
- **Comment stragglers fixed** in `session-observer.ts` / `session-end.ts` (caught by adversarial review).

## Verification

- `npm run build` clean; full `npx vitest run` **35,742 passed / 0 real failures** (one `src/graph` latency test load-flaked under the concurrent review fleet; passes in isolation + clean re-run).
- **pre-tag-gate 20/20** (clean re-run).
- **Adversarial review:** 15 findings, **14 refuted / 1 confirmed** (the MINOR comment fix); 4 new bootstrap differential tests in existing suites → gate stays 20 steps.

## Engine state

NASA degree **1.178** · counter-cadence **29** · manifest lessons **152** — unchanged.
