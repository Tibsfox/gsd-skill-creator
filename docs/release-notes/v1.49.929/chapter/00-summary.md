# v1.49.929 — Summary

## The ship

The cross-rootdir concept-fallback wire (`ConceptFallbackProvider`, declared in
`src/predictive-skill-loader/fallback.ts`, satisfied by `RosettaConceptFallback` in
`.college/integration/`) had two production callers — copper
`PipelineActivationDispatch` (v1.49.830) and the M5 orchestration `ActivationSelector`
(v1.49.832) — but only the copper caller had an application-boundary integration test
(v1.49.832). The selector caller had unit coverage against a mock provider only.

v1.49.929 adds `tests/integration/selector-rosetta-fallback-wire.integration.test.ts`,
closing that symmetry gap and deepening the proof: it drives the selector's
fire-and-forget low-confidence fallback through a **real** `RosettaConceptFallback`
backed by a **real** `RosettaCore` engine (real `ConceptRegistry`, `PanelRouter`,
`ExpressionRenderer`, panels) populated with **real** department concepts — where the
copper test fed a `vi.fn()` engine spy and a toy registry. "Run the path, don't read
it" (the v1.49.919 lesson).

## Why this closes GAP-2

GAP-2 ("College of Knowledge Not Wired") asked for a "consumer engine that queries the
college from inside the loop." Both production callers already invoke
`fallback.onLowConfidence(...)` when a prediction round's max score falls below the
configured `lowConfidenceThreshold`. With v929, BOTH callers now have integration
tests proving that query fires end-to-end against a real engine. Per this codebase's
established definition-of-done for cross-rootdir consume-axis closures (the
`SkillActivationObserver` family closed the same way at v823/v829), integration-test
proof IS the closure. GAP-2 → CLOSED.

## The architectural finding

The carry-forward framed this as "wire the College concept-fallback into live dispatch
— an organic composition root." Recon showed that target has no **sound** production
site. The boundary is enforced asymmetrically: `src/`→`.college/` is a hard tsc
`rootDir` error (a composition root in `src/` cannot even reference the provider),
while `.college/`→`src/` is not tsc-caught (`.college/` is outside the build `include`)
but is forbidden by the cross-rootdir discipline (failure mode #1: breaks at
vitest-project separation and runtime bundling) and by the separate-dist-tree
invariant. A lone latent dead-code instance — `runbook-interface.ts` type-importing
`src/types/openstack.js` — is the cautionary case proving why. So neither rootdir hosts
a sound composition root; the ONLY sound bridge is the vitest `integration` project.
The integration test is therefore not a stepping-stone to a later organic root — it IS
the closure. This is now documented as a corollary in
`docs/cross-rootdir-wire-discipline.md`.

Additionally, both dispatchers (`PipelineActivationDispatch`, `ActivationSelector`)
have zero production callers today — they are substrate awaiting a consumer — so there
is no running "live dispatch" to wire into in the runtime sense, reinforcing that the
integration test is the correct and complete closure.

## Scope discipline

A pure verify-axis ship (#10438): a small test-infrastructure addition that proves an
existing substrate-and-caller wire, with **no new `src/` behavior**, no new substrate,
no new calibratable threshold, and no new manifest lesson. Counter-cadence unchanged
at 20; NASA degree unchanged at 1.178.
