# v1.49.930 — Summary

## The ship

v1.49.929's adversarial verify surfaced a single latent `.college/`→`src/`
cross-rootdir import: `.college/departments/cloud-systems/extensions/runbook-interface.ts`
type-imported `OpenStackServiceName`/`VerificationMethod` from `src/types/openstack.js`.
The cross-rootdir discipline (#10435) forbids that direction, but **tsc cannot catch
it** — `.college/` is outside the build `include`, so the import "compiled" while being
both a discipline violation and dead code (its exports had zero importers repo-wide).

v1.49.930 closes the class in two layers:

- **CF1a (source-eliminator):** delete the dead `runbook-interface.ts` entirely.
- **CF1b (detector gate):** add `tools/college-src-boundary-audit.mjs` + a vitest whose
  live Case-6 scans the real `.college/` tree and fails if any `.college/`→`src/` import
  reappears. The test is enrolled in the gate+CI-enforced tools suite, so the gate runs
  every ship with no operator vigilance required.

## Why both layers, together

This is the two-layer closure discipline (#10436): a source eliminator without a
detector lets a future author re-introduce the class silently; a detector without the
eliminator leaves the known instance in place. Either alone is incomplete, so they ship
in one milestone. The original carried-forward note in the discipline doc said exactly
this — "a standing `.college/`→`src/` import audit would gate this class
(gate-not-vigilance)" — and v930 builds that gate.

The boundary is special because it is **asymmetric**: `src/`→`.college/` is a hard tsc
`rootDir` error (the compiler enforces it), but `.college/`→`src/` is invisible to tsc.
For this direction the audit gate is the *only* structural enforcement — which is
precisely why a standing gate, not a one-time cleanup, is the correct closure.

## Scope discipline

A cleanup+infra ship: one dead file removed, one ~190-line audit tool added, one test
file (7 cases) enrolled, one discipline-doc row flipped. No `src/` production behavior
changed; no new substrate, threshold, or manifest lesson. Counter-cadence unchanged at
20; NASA degree unchanged at 1.178.

This is the first item of the v929-carry-forward campaign (CF1 of CF1–CF4).
