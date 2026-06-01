# v1.49.941 — Summary

## The ship

A security/dependency fix. Two npm advisories — one **critical**, one moderate — were resolved by moving the vitest test-runner family to the patched **4.1.8** line and bumping the affected transitive packages. The change is **two `package.json` range bumps + `package-lock.json`**; no source, test, or config file changed.

## The advisories

- **`vitest` <4.1.0 — CRITICAL** (GHSA-5xrq-8626-4rwp): the Vitest UI server can read and execute arbitrary files while listening. Repo was pinned at 4.0.18. Critical severity tripped the npm-audit probe's `--audit-level=high` threshold.
- **`qs` 6.11.1-6.15.1 — moderate** (GHSA-q8mj-m7cp-5q26): a remotely-triggerable `qs.stringify` DoS, present transitively at 6.15.0.

## How it surfaced

The pre-tag-gate's `vitest` step went red on `closure-verify-cf.test.ts > npm-audit probe`, which runs `npm audit --audit-level=high` and asserts a clean result. The critical vitest advisory had just been published. This is the probe doing its job (Lesson #10208 — gate-not-vigilance). It mattered beyond the local gate: CI runs the same probe, so the **next push to `main` would have gone red** on the live advisory.

## The fix

- `npm audit fix` re-resolved the lockfile: vitest 4.0.18 → 4.1.8 (full `@vitest/*` family), qs 6.15.0 → 6.15.2, es-module-lexer 1.7.0 → 2.1.0, tinyrainbow 3.0.3 → 3.1.0, plus added support packages. 0 vulnerabilities.
- `package.json`: `vitest` and `@vitest/coverage-v8` ranges raised `^4.0.18` → `^4.1.8`. This excludes the vulnerable range at the manifest level and aligns `@vitest/coverage-v8` (which `npm audit fix` had left at 4.0.18 → an `invalid peer` against vitest 4.1.8) onto the same line.

## Verification

Full suite **35663 passed / 0 failed** under vitest 4.1.8 — the minor bump and the es-module-lexer 1 → 2 major bump caused zero breakage. `tsc` exit 0. `npm audit` 0 vulnerabilities. `npm ls` clean (no invalid peer). Pre-tag-gate 18/18.

## Engine state

NASA 1.178 (unchanged), counter-cadence **20** (unchanged — security fix, not a counter-cadence ship; the #21 macOS sweep follows as v1.49.942), manifest 150.
