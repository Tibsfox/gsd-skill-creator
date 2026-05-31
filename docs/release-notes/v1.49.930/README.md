---
title: "v1.49.930 — Standing .college/→src/ import gate + dead-code cleanup (CF1)"
version: v1.49.930
date: 2026-05-31
summary: >
  The lone latent .college/→src/ cross-rootdir import (a dead-code type-import in
  runbook-interface.ts, surfaced by the v1.49.929 adversarial verify) is removed,
  and recurrence is now structurally gated by a new audit tool
  (tools/college-src-boundary-audit.mjs) whose live drift-guard runs in the
  gate+CI-enforced tools suite. This is the two-layer closure (#10436):
  source-eliminator + detector gate shipped together, because tsc cannot catch
  the .college/→src/ direction (asymmetric boundary, #10435).
tags: [college, cross-rootdir, "#10435", "#10436", gate-not-vigilance, two-layer-closure, cleanup, audit-tool]
---

# v1.49.930 — Standing .college/→src/ import gate + dead-code cleanup (CF1)

**Shipped:** 2026-05-31

One-line: delete the sole latent `.college/`→`src/` cross-rootdir import
(`runbook-interface.ts`, dead code) and add `tools/college-src-boundary-audit.mjs`
+ its live drift-guard so the boundary class can never silently recur — the
source-eliminator and detector gate that together complete the two-layer closure.

## What shipped

- **The dead-code removal** (`refactor(college)`, CF1a): the v1.49.929 adversarial
  verify surfaced one latent `.college/`→`src/` import —
  `.college/departments/cloud-systems/extensions/runbook-interface.ts` type-imported
  `OpenStackServiceName`/`VerificationMethod` from `src/types/openstack.js`. The
  module's exports (`TrySessionStep`, `RunbookSessionConfig`, `createRunbookSession`)
  had **zero importers** repo-wide, so the whole file was dead. It "compiled" only
  because tsc never sees `.college/` (it sits outside the build `include`), and it
  would have broken the moment `.college/` shipped independently. Removed entirely.

- **The standing gate** (`feat(tools)`, CF1b): a new
  `tools/college-src-boundary-audit.mjs` walks `.college/**/*.ts`, comment-strips each
  file (so a `src/...` reference inside a comment doesn't false-positive), and flags
  any import specifier that resolves into the `src/` rootdir — either a relative path
  whose resolved location contains a `/src/` segment (and not `/.college/`), or a bare
  `src/...` specifier. It mirrors `tools/atlas-deps-audit.mjs` (`--json`, `--strict`,
  `--root`/`--college-root` overrides; exit 1 on violation; `CROSS_ROOTDIR_VIOLATION`
  kind). The companion test (`tools/__tests__/college-src-boundary-audit.test.mjs`,
  7 cases) is enrolled in `vitest.tools.config.mjs`, whose explicit include list is
  itself drift-guarded — so the test runs in pre-tag-gate step 2.5 and CI. Its
  non-hermetic Case 6 scans the **live** `.college/` tree (1511 files, 0 violations
  after CF1a): that case IS the standing drift-guard.

- **Discipline doc** (`docs/cross-rootdir-wire-discipline.md`): the carried-forward
  "latent `.college/`→`src/` cross-import" observation row is flipped to
  **CLOSED v1.49.930**, recording the two-layer closure (#10436) and noting the gate
  as the only structural enforcement of this boundary (tsc cannot catch it, #10435).

## Verification

- `node tools/college-src-boundary-audit.mjs` → `PASS — 1511 files scanned, 0
  violations`, exit 0. **Mutation-proven**: injecting a `.college/` file that imports
  `../../src/types/openstack.js` makes the live audit FAIL exit 1 with
  `CROSS_ROOTDIR_VIOLATION`; the probe was removed, restoring PASS.
- New test file: 7/7 pass. Coverage drift-guard (`tools-config-coverage.test.mjs`):
  12/12 pass (the new test is correctly enrolled).
- `tsc --noEmit` clean. No `src/` production code changed.

## Engine state

NASA degree **1.178** (unchanged). Counter-cadence **20** (unchanged — forward
cleanup+infra, not a cleanup-mission). Manifest **150** (no new lesson — this is a
two-layer-closure #10436 instance for the cross-rootdir boundary class, recorded in
the discipline doc). Architecture gaps unchanged from v929: 6/7
closed-or-intentional.
