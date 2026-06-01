---
title: "Context"
chapter: 99-context
version: v1.49.937
date: 2026-06-01
summary: "Where v1.49.937 sits in the larger arc."
tags: [context]
---

# v1.49.937 — Context

## Where this sits

- The **eighth and final** item of the **v929 carry-forward campaign** (CF4d), after CF1
  (v930), CF2a (v931), the v932 recovery, CF2b (v933), CF3 (v934), CF4b+CF4c (v935), and
  CF4a (v936). **This ship completes the campaign.**
- CF4d = the deferred `algebrus.eigen` complex-serialization wire fix, discovered during
  the v935 recon (it was not in the original scope). `cpu.eigen` now emits JSON-safe
  `{re, im}` pairs; the TS client exposes `EigenResult`.
- Orthogonal to the CF4c verdict: eigen remains CPU-only. The fix only made its existing
  CPU result wire-safe. No GPU eigen path was added.

## Engine state

- NASA degree 1.178 (unchanged).
- counter-cadence 20 (unchanged — forward fix work).
- manifest 150 lessons (no new lesson; an application of #10427, plus carried-forward
  candidates on force-casting for a stable wire contract and on pairing a gated live test
  with an ungated static drift-guard).
- Architecture gaps unchanged: 6/7 closed-or-intentional.

## References

- The fix: `coprocessors/math/math_coprocessor/fallback/cpu.py` (`_to_complex_pairs` + `eigen`).
- The dispatch path: `chips/algebrus.py:eigen` → `fallback/cpu.py:eigen`; serialized at
  `server.py` `json.dumps` (no encoder change there — the source emits wire-safe shapes).
- The TS contract: `src/coprocessor/types.ts` (`Complex`, `EigenResult`); `client.ts:eigen()`.
- CI-safe guard: `src/coprocessor/__tests__/normalize.test.ts` (`EIGEN_CPU`); live oracle:
  `src/coprocessor/__tests__/numerical-analysis-coprocessor.integration.test.ts` (gated).
- The verdict record: `coprocessors/math/PACKAGE.md` (CF4c block → CF4d RESOLVED).
- The discipline: `docs/failure-mode-contracts.md` (#10427, silent-vs-loud).
- Prior milestone: v1.49.936 (CF4a — staged non-blocking cargo CI lane).
