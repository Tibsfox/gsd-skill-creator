# v1.49.929 — Retrospective

## What went well

- **Recon caught a false target before any code was written.** The carry-forward
  ("wire the concept-fallback into live dispatch via an organic composition root") named
  a construct the rootdir boundary forbids. A 4-scout understand-workflow established
  that (a) both production callers already invoke the wire, (b) the copper caller
  already has integration-test closure, (c) no production location can import both
  rootdirs, and (d) the project's accepted definition-of-done is integration-test
  closure. The genuine remaining value — the selector symmetry gap + a real-engine
  proof — was then well-scoped.

- **Real-engine proof surfaced new ground safely.** Both chosen concepts have empty
  panel maps, so `RosettaCore.translate` runs the natural-language fallback render
  path — a path neither the copper spy nor the `.college` roundtrip test (concepts
  WITH panels) ever exercised. Reading `expression-renderer.ts` confirmed the path is
  non-throwing (`!panel || !expression → buildNaturalFallback`) before writing the
  assertion, rather than discovering it at test-run time.

- **Mutation-proof confirmed load-bearing.** Disabling the selector's
  `onLowConfidence` call (`if (false && fallback)`) turned exactly 2 tests red
  (`captured.length` 0≠1); the structural, throw-contract, and direct-engine tests
  stayed green. Reverted via `git checkout`.

- **Every delegated claim was cross-checked.** A PostToolUse scan flagged the
  concept-search agent's response; per the v1.49.927 harness-corruption discipline,
  every concept id / domain / relationship / export name the agent reported was
  verified against source via direct Read before being used. All claims held.

- **The pre-commit adversarial verify earned its keep (again).** A 2-lens skeptical
  pass (test-validity + claims-honesty) caught an overclaim before commit: the first
  draft said "no production location may import both rootdirs / a cross-import is a tsc
  error." The truth is asymmetric — `src/`→`.college/` is a tsc `rootDir` error, but
  `.college/`→`src/` is NOT tsc-caught, and a latent dead-code instance exists
  (`runbook-interface.ts`). The claim was corrected in the discipline doc + release
  notes before commit. (Mirrors the v928 process note: run the adversarial verify on
  honesty-themed ships.)

## What was tricky

- **Observing through fire-and-forget.** `_emitPredictions` discards the provider's
  return value, so the real suggestion is invisible to the caller. A thin recording
  wrapper that delegates to the real provider and captures its real output bridges the
  boundary without mocking the engine — the registry, engine, and fallback logic stay
  real; only an observation tap is added.

- **Activation requires `composite > 0`.** With sensoria off, a candidate activates
  only if its αβγ composite is strictly positive. The test gives each candidate both
  query-token overlap and `importance` to guarantee activation, so `_emitPredictions`
  reliably fires.

## Follow-up surfaced

- **Latent `.college/`→`src/` cross-import (cleanup candidate).**
  `.college/departments/cloud-systems/extensions/runbook-interface.ts` type-imports
  `src/types/openstack.js` — a violation of the cross-rootdir discipline (failure mode
  #1), invisible to tsc because `.college/` is outside the build `include`, and dead
  code (no importers). Left in place this ship (unrelated to the concept-fallback wire;
  scope discipline); documented in the discipline doc's carried-forward table. A
  dedicated cleanup should replace it with a local type declaration or delete the file,
  and a standing `.college/`→`src/` import audit would gate the class.

## What to watch

- **macOS is now load-bearing (from v928).** This ship touched no `src/` production
  code and is test+docs-only, so macOS-flake risk is minimal — but the monitoring
  window from v928 remains open.
- **50ms fire-and-forget settle.** The verify lens flagged the integration test's 50ms
  wait as a theoretical flake risk under full-suite contention (it matches #10454 and
  is more conservative than the stable copper test's 10ms). Bump to 100ms if it ever
  flakes in CI.
