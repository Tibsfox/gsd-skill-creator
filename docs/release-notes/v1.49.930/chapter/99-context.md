---
title: "Context"
chapter: 99-context
version: v1.49.930
date: 2026-05-31
summary: "Where v1.49.930 sits in the larger arc."
tags: [context]
---

# v1.49.930 — Context

## Where this sits

- First ship of the **v929-carry-forward campaign** (CF1 of CF1–CF4), executing the
  carry-forwards named in the v1.49.929 handoff. CF1 pairs the two CF1 subitems —
  CF1a (cleanup) + CF1b (gate) — into one milestone per the two-layer-closure rule
  (#10436).
- Directly closes the cleanup candidate surfaced by the v1.49.929 adversarial verify:
  the latent `.college/`→`src/` dead-code import in `runbook-interface.ts`.
- Completes the `.college/`↔`src/` boundary contract: v929 added the "composition-root
  N/A" corollary (#10435) describing why no sound composition root exists; v930 adds the
  structural gate for the one direction tsc can't enforce.
- Continues the forward cleanup/infra cadence between counter-cadence milestones
  (counter-cadence last moved at v925/#20).

## Engine state

- NASA degree 1.178 (unchanged).
- counter-cadence 20 (unchanged — forward cleanup+infra, not a cleanup milestone).
- manifest 150 lessons (no new lesson; #10436 cross-rootdir instance + #10435
  carried-forward row closed in the discipline doc).
- Architecture gaps unchanged: GAP-1/2/4/6 CLOSED, GAP-3/5 intentional, GAP-7 open →
  6/7 closed-or-intentional.

## References

- The gate: `tools/college-src-boundary-audit.mjs` + `tools/__tests__/college-src-boundary-audit.test.mjs`.
- Enrollment: `vitest.tools.config.mjs` (explicit include list, drift-guarded).
- The discipline: `docs/cross-rootdir-wire-discipline.md` (#10435 + the CLOSED row).
- The two-layer-closure discipline: `docs/two-layer-closure-discipline.md` (#10436).
- Prior milestone: v1.49.929 (selector concept-fallback integration test; GAP-2 closed).
