---
title: "v1.49.941 — security: resolve critical vitest-UI + moderate qs advisories (vitest family → 4.1.8)"
version: v1.49.941
date: 2026-06-01
summary: >
  A newly-published critical advisory (GHSA-5xrq-8626-4rwp — the Vitest UI server
  can read and execute arbitrary files when listening) affected vitest <4.1.0; the
  repo was pinned at 4.0.18. A second, moderate advisory (GHSA-q8mj-m7cp-5q26 — a
  remotely-triggerable DoS in qs) affected a transitive qs 6.15.0. The
  closure-verify-cf npm-audit probe (which runs `npm audit --audit-level=high`)
  caught the critical one mid-ship and blocked the pre-tag-gate — exactly its job.
  This ship resolves both: `npm audit fix` re-resolves the lockfile (vitest family
  4.0.18 → 4.1.8, qs → 6.15.2, es-module-lexer 1.7.0 → 2.1.0, +transitive), and the
  vitest + @vitest/coverage-v8 manifest ranges are raised to ^4.1.8 so the
  vulnerable range is excluded at the manifest level and the vitest family stays
  internally consistent (no invalid peer). The full suite passes unchanged under
  vitest 4.1.8 (35663 passed, 0 failed). It also prevents main CI going red on the
  next push, since the live advisory would have failed the same probe in CI.
tags: [security, deps, vitest, qs, advisory, npm-audit, "GHSA-5xrq-8626-4rwp", "GHSA-q8mj-m7cp-5q26"]
---

# v1.49.941 — security: resolve critical vitest-UI + moderate qs advisories (vitest family → 4.1.8)

**Shipped:** 2026-06-01

One-line: a freshly-published **critical** vitest-UI advisory (and a moderate qs DoS) surfaced through the npm-audit probe and blocked the gate; this ship resolves both by moving the vitest family to the patched 4.1.8 line and bumping the affected transitive deps.

## Why this ship

While preparing an unrelated counter-cadence ship, the pre-tag-gate's `vitest` step went red on a single test: `tests/__tests__/closure-verify-cf.test.ts > npm-audit probe > reports resolved-upstream`. That test runs `npm audit --audit-level=high` and asserts a clean (exit 0) result. It was failing because two advisories had just been published:

- **`vitest` <4.1.0 — CRITICAL** ([GHSA-5xrq-8626-4rwp](https://github.com/advisories/GHSA-5xrq-8626-4rwp)): "When the Vitest UI server is listening, an arbitrary file can be read and executed." The repo was pinned at **4.0.18**. Because the severity is critical (>= high), it tripped the probe's `--audit-level=high` threshold.
- **`qs` 6.11.1-6.15.1 — moderate** ([GHSA-q8mj-m7cp-5q26](https://github.com/advisories/GHSA-q8mj-m7cp-5q26)): a remotely-triggerable DoS (`qs.stringify` crashes on null/undefined entries in comma-format arrays with `encodeValuesOnly`). Present transitively at **6.15.0**. (Moderate is below the probe's high threshold, so it did not by itself block the gate, but it is fixed here too.)

Two things made this load-bearing rather than cosmetic. First, the **practical** exposure of the critical advisory is limited — it requires a developer to start the opt-in Vitest UI server (`vitest --ui`), which the project's CI and pre-tag-gate never do — but `npm audit` flags it regardless, and the probe is wired to block on high+ severity. Second, and more importantly, CI runs the same `npx vitest run` that includes this probe, so the **next push to `main` would have turned CI red** on the live advisory (CI was green only because no push had happened since the advisory went live). Resolving it now keeps `main` green.

The npm-audit probe doing exactly what it was built for (catching a fresh critical advisory before it reddened CI) is the gate-not-vigilance design working as intended (Lesson #10208).

## What shipped

- **`package-lock.json`** — `npm audit fix` re-resolved the tree: **vitest 4.0.18 → 4.1.8** (and the whole `@vitest/*` family: expect / runner / snapshot / mocker / spy), **qs 6.15.0 → 6.15.2**, **es-module-lexer 1.7.0 → 2.1.0**, **tinyrainbow 3.0.3 → 3.1.0**, plus newly-added support packages (`convert-source-map`, `std-env`, `@vitest/utils`, `@vitest/pretty-format`). Net: +10 packages, 9 changed, **0 vulnerabilities**.
- **`package.json`** — the **`vitest`** and **`@vitest/coverage-v8`** ranges are raised `^4.0.18` → **`^4.1.8`**. This does two things: (1) excludes the vulnerable `4.0.x` range at the manifest level so a future `npm install` re-resolution can never pull a vulnerable vitest back in, and (2) aligns `@vitest/coverage-v8` (which `npm audit fix` left at 4.0.18, producing an `invalid peer` against the new vitest 4.1.8) to the same line, so the vitest family is internally consistent.

That is the entire change: **two manifest range bumps + the lockfile**. No source, test, or config file changed.

## Verification

- **Full suite passes unchanged under vitest 4.1.8: 35663 passed / 0 failed** (7 skipped, 7 todo; was `1 failed` only on the now-resolved npm-audit probe). The vitest minor bump and the **es-module-lexer 1 → 2 major** bump introduced zero test breakage.
- `tsc --noEmit` exit 0.
- `npm audit` and `npm audit --audit-level=high` both report **0 vulnerabilities** (exit 0).
- `npm ls vitest @vitest/coverage-v8` shows both deduped at **4.1.8** with **no `invalid` peer**.
- Full pre-tag-gate: all 18 steps PASS (the `vitest` step, previously blocked by the probe, is now green).

## Why a separate ship

The advisory surfaced during an unrelated counter-cadence test-hardening ship (the macOS flip-readiness Set-boundary sweep, which lands next as v1.49.942). Bundling a security/dependency upgrade — including an `es-module-lexer` major bump — into a test-hardening milestone would have conflated two unrelated concerns and put a risky toolchain change behind a maintenance headline. Shipping the security fix on its own keeps each milestone single-purpose and gives the dependency upgrade its own validated, revertable commit.

## Engine state

NASA degree **1.178** (unchanged). Counter-cadence **20** (unchanged — this is a security/dependency fix, not a counter-cadence ship; the counter-cadence #21 sweep follows as v1.49.942). Manifest **150** (no new lesson — one #10208 application + a carried-forward candidate on `npm audit fix` manifest-floor/peer hygiene, in the lessons chapter).
