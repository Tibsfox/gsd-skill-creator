---
title: "Context"
chapter: 99-context
version: v1.49.935
date: 2026-06-01
summary: "Where v1.49.935 sits in the larger arc."
tags: [context]
---

# v1.49.935 — Context

## Where this sits

- The sixth shipped item of the **v929 carry-forward campaign** (CF4b + CF4c), after CF1
  (v930), CF2a (v931), the v932 recovery, CF2b (v933), and CF3 (v934).
- CF4b = the first shipped skill to declare a `coprocessor:` block, giving the default-on
  math-coprocessor activation stage its first declared consumer. CF4c = the
  `algebrus.eigen` intentionally-CPU-only verdict, folded into CF4b's docs (a 0-ship
  verdict, no standalone milestone).
- Remaining campaign work: CF4a (staged non-blocking cargo CI lane via the v923/v928
  pattern) and CF4d (the deferred `algebrus.eigen` complex-serialization wire fix,
  discovered during this ship's recon).

## Engine state

- NASA degree 1.178 (unchanged).
- counter-cadence 20 (unchanged — forward codify/verify work).
- manifest 150 lessons (no new lesson; an #10411 instance; one carried-forward candidate
  on declared-vs-runtime consumers).
- Architecture gaps unchanged: 6/7 closed-or-intentional.

## References

- The augmented skill: `examples/skills/math/numerical-analysis/SKILL.md` (declares
  `coprocessor: [algebrus, statos]`).
- The two tests: `src/coprocessor/__tests__/numerical-analysis-coprocessor.test.ts`
  (always-on round-trip) and `numerical-analysis-coprocessor.integration.test.ts` (gated live).
- The activation chain exercised: `createCoprocessorStage` -> `extractCoprocessorRaw` ->
  `parseCoprocessorSpec` -> `activateCoprocessor` (`src/coprocessor/`).
- The CF4c verdict: `coprocessors/math/PACKAGE.md` (op-site) + `coprocessors/math/chipset.yaml`.
- Prior milestone: v1.49.934 (CF3 — substrate integration proofs).
