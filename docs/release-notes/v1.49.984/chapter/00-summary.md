# v1.49.984 — Summary

## The ship

Adds `skill-creator integration migrate`, the operator's item-4 follow-on: a dry-run-by-default config migrator that deletes an explicit `observation.mine_active_skills: false` from a pre-5.1c install so it re-inherits the 5.1c default (`true`). It closes the gap the v981 default-flip left for explicit-false 5.1b installs.

## What shipped

- **New `integration migrate` subcommand** — detects an explicit `observation.mine_active_skills: false` (absent / `true` → no-op) and **deletes the key** (operator's delete-key choice).
- **Dry-run default; `--apply` writes** after backing up to `<path>.bak.<timestamp>`.
- **Allowlist guard** — only `observation.mine_active_skills` may change; a deep-equal check aborts on any broader delta (protects siblings like `retention_days`). Idempotent.
- **Operator-invoked only** — not in `install.cjs` auto-run.

## Verification

- `npm run build` clean; full `npx vitest run` green (35,785+ tests, 0 failures); 27 integration-config unit tests + a real e2e smoke test.
- 3-lens adversarial review: 0 real BLOCKER/MAJOR; 3 MINORs fixed/triaged (dropped over-strict re-validate; added migrate to top-level help; deferred pre-existing docs/CLI.md gap).

## Engine state

NASA degree **1.178** · counter-cadence **29** · manifest lessons **152** — all unchanged.
