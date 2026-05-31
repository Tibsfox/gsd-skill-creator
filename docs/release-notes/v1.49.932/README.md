---
title: "v1.49.932 — Recover v931 red CI: integration-test fixture fix + gate the integration project"
version: v1.49.932
date: 2026-05-31
summary: >
  v1.49.931 shipped with a malformed BranchManifest fixture in its new
  integration test, turning CI red on main (the feature code was correct; only
  the test fixture was wrong). v1.49.932 corrects the fixture AND closes the gate
  gap that let it through: the pre-tag-gate now runs the integration project
  (npx vitest run --project integration — the same command CI runs at ci.yml:69),
  so a red integration test can no longer pass the local gate. Two-layer closure
  (#10436 / #10461).
tags: [recovery, ci, integration-test, pre-tag-gate, "#10461", "#10436", gate-not-vigilance]
---

# v1.49.932 — Recover v931 red CI: fixture fix + gate the integration project

**Shipped:** 2026-05-31

One-line: fix the malformed `BranchManifest` fixture that turned v1.49.931's
integration test (and thus CI on main) red, and add the integration project to the
pre-tag-gate so the local gate now runs the same integration step CI runs.

## What happened (honest postmortem)

v1.49.931 added `tests/integration/branch-variant-stochastic-wire.integration.test.ts`.
Two of its `explore()` cases built a `BranchManifest` fixture with the wrong
field names (`branchId`/`forkedAt`/`trunkHashAtFork` instead of the real
`id`/`parentHash`/`parentByteLength`/`createdAt`/`proposedByteLength`/`deltaFraction`),
so `validateManifest` threw and those 2 cases failed. The **feature code was
correct** — the 5 `selectBranchVariant` cases (including the load-bearing
stochastic-spread assertion) passed. CI went red on `main`.

Root cause of the escape: pre-tag-gate step 2 runs `npx vitest run`, but the root
vitest project **excludes `**/*.integration.test.ts`** and the `integration`
project is opt-in (`vitest.config.ts`). CI runs the integration tests as a
separate step (`.github/workflows/ci.yml:69` → `npx vitest run --project
integration`). So the local gate never executed the broken test — it only failed
in CI, after the tag and push. (Contributing process failures, recorded in the
retrospective: the bump command was wrong so the version never advanced, and the
backgrounded gate wasn't waited on.)

## What shipped

- **Source fix** (`tests/integration/branch-variant-stochastic-wire.integration.test.ts`):
  the manifest fixture now uses the real `BranchManifest` schema; all 7 cases pass.

- **Detector** (`tools/pre-tag-gate.sh`, new step 2.8): runs `npx vitest run
  --project integration` — byte-identical to the CI step at ci.yml:69. A red
  integration test now fails the local gate *before* a tag exists (#10461
  gate-enforce-every-runnable-surface). The integration project is hermetic (its
  4 GPU/coprocessor cases self-skip without a venv), so this adds no external
  dependency to the gate.

## Verification

- `npx vitest run tests/integration/branch-variant-stochastic-wire.integration.test.ts`
  → 7/7 pass.
- `npx vitest run --project integration` → 68 passed + 4 skipped, exit 0.
- `bash -n tools/pre-tag-gate.sh` → valid; step 2.8 is a structural mirror of
  steps 2.5/2.7.
- pre-tag-gate (now including step 2.8) green; **CI green on main** (the recovery
  this ship exists to confirm).

## Engine state

NASA degree **1.178** (unchanged). Counter-cadence **20** (unchanged — recovery +
gate hardening, forward work). Manifest **150** (no new lesson — a #10461 / #10436
instance). The version-files bump that v930/v931 silently skipped (a no-op `npm run
version` left package.json at 1.49.929) is corrected here: the manifests advance to
1.49.932 via `node scripts/bump-version.mjs 1.49.932`. The v930/v931 **tags** retain
their stale internal version by operator decision (tag name is the release id; no
history rewrite). Third shipped item of the v929 carry-forward campaign (the CF2a
recovery).
