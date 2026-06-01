---
title: "Context"
chapter: 99-context
version: v1.49.941
date: 2026-06-01
summary: "Where v1.49.941 sits in the larger arc."
tags: [context, security, deps]
---

# v1.49.941 — Context

## Milestone metadata

- **Version:** v1.49.941
- **Type:** Security / dependency fix (degree-non-advancing)
- **Predecessor:** v1.49.940 (gateway integration tests on ephemeral ports)
- **NASA degree:** 1.178 (unchanged)
- **Counter-cadence count:** 20 (unchanged — this is a security fix, not a counter-cadence ship)

## Where this sits

- An **unplanned security ship**, surfaced by the pre-tag-gate of a different ship. While preparing the
  counter-cadence macOS flip-readiness sweep, the gate's `vitest` step went red on the npm-audit probe —
  a critical vitest-UI advisory (GHSA-5xrq-8626-4rwp) and a moderate qs advisory (GHSA-q8mj-m7cp-5q26)
  had just been published.
- The macOS counter-cadence sweep was cleanly unwound (nothing had been pushed) and re-sequenced to
  **v1.49.942**, so the security fix could ship on its own.
- It keeps `main` CI green: CI runs the same npm-audit probe via `npx vitest run`, so the live advisory
  would have reddened CI on the next push (CI was green only because none had happened since the
  advisory went live).

## Files changed

- `package-lock.json` — `npm audit fix` re-resolution: vitest family 4.0.18 → 4.1.8, qs 6.15.0 → 6.15.2,
  es-module-lexer 1.7.0 → 2.1.0, tinyrainbow 3.0.3 → 3.1.0, plus added support packages (+10 / 9 changed).
- `package.json` — `vitest` and `@vitest/coverage-v8` ranges raised `^4.0.18` → `^4.1.8` (exclude the
  vulnerable range at the manifest level; align the vitest family — no `invalid peer`).
- `docs/release-notes/v1.49.941/` — milestone notes (README + 00/03/04/99 chapters).

No source, test, or non-manifest config file changed.

## Test posture

- Full suite under vitest 4.1.8: **35663 passed / 0 failed** (7 skipped, 7 todo). Zero breakage from the
  vitest minor bump or the es-module-lexer 1 → 2 major bump.
- `tsc --noEmit` exit 0.
- `npm audit` / `npm audit --audit-level=high`: **0 vulnerabilities**.
- `npm ls vitest @vitest/coverage-v8`: both deduped at 4.1.8, no `invalid` peer.
- Full pre-tag-gate: 18/18 PASS.

## Engine state at close

- NASA degree 1.178 (unchanged).
- Counter-cadence count 20.
- Manifest: 150 lessons (one #10208 application + one carried-forward candidate — `npm audit fix`
  manifest-floor/peer hygiene).
- Architecture gaps: 6/7 closed-or-intentional (unchanged).

## References

- The advisories: [GHSA-5xrq-8626-4rwp](https://github.com/advisories/GHSA-5xrq-8626-4rwp) (vitest, critical),
  [GHSA-q8mj-m7cp-5q26](https://github.com/advisories/GHSA-q8mj-m7cp-5q26) (qs, moderate).
- The probe that caught it: `scripts/closure-verify-cf.mjs npm-audit` / `tests/__tests__/closure-verify-cf.test.ts`.
- Predecessor: v1.49.940 (gateway integration tests on ephemeral ports).
- Successor (re-sequenced): v1.49.942 (macOS flip-readiness Set-boundary test hardening, counter-cadence #21).
