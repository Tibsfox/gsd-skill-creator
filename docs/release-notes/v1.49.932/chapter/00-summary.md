# v1.49.932 — Summary

## The ship

A recovery ship. v1.49.931 introduced an integration test whose `explore()` cases
built a `BranchManifest` with the wrong field names; `validateManifest` rejected
it and CI went red on `main`. The feature itself was correct — only the test
fixture was malformed.

v1.49.932 does two things:

1. **Fixes the fixture** so all 7 cases of the v931 test pass.
2. **Closes the gate gap** that let the red test escape: the pre-tag-gate now runs
   the integration project (`npx vitest run --project integration`, step 2.8) —
   the same command CI runs at `.github/workflows/ci.yml:69`. Before this, step 2's
   plain `npx vitest run` did not execute the integration tests at all: the root
   vitest project *excludes* `**/*.integration.test.ts`, and the `integration`
   project is opt-in. So the local gate was blind to integration failures.

## Why two layers

This is the two-layer closure discipline (#10436) applied to a CI-escape: a fixture
fix alone (source) would unbreak this one test but leave the next malformed
integration test free to escape to CI again. The gate step (detector) makes the
local gate run the same integration surface CI runs (#10461). Either layer alone is
incomplete.

## The honest part

The v931 ship proceeded past a visible "2 failed" test result, the version-files
bump silently no-opped (the wrong `npm run version` command left package.json at the
predecessor version), and the backgrounded gate wasn't waited on. Three process
failures compounded. The durable corrections are structural — the integration gate
step here, plus the corrected bump procedure — not a resolution to be more careful.
The full root cause is in the retrospective.

## Scope discipline

One test-fixture correction (test-only), one pre-tag-gate step (a structural mirror
of CI's integration step), and the corrected version bump to 1.49.932. No `src/`
production change, no new substrate, no new manifest lesson. Counter-cadence
unchanged at 20; NASA degree unchanged at 1.178.
