---
title: "v1.49.929 — Close the College concept-fallback selector wire (GAP-2)"
version: v1.49.929
date: 2026-05-31
summary: >
  The M5 orchestration ActivationSelector — the second production caller of the
  cross-rootdir concept-fallback wire — now has an application-boundary
  integration test, driven by a REAL RosettaCore engine over real department
  concepts (theology→astronomy cross-domain analogy), not a spy. This closes the
  copper/selector symmetry gap and, with both callers proven end-to-end, closes
  GAP-2 ("College of Knowledge Not Wired"). A verify-axis ship (#10438); no new
  src/ behavior, no new lesson.
tags: [college, cross-rootdir, concept-fallback, GAP-2, "#10435", "#10438", verify-axis, integration-test]
---

# v1.49.929 — Close the College concept-fallback selector wire (GAP-2)

**Shipped:** 2026-05-31

One-line: add `tests/integration/selector-rosetta-fallback-wire.integration.test.ts`,
which drives the M5 `ActivationSelector`'s low-confidence fallback through a **real**
`RosettaConceptFallback` backed by a **real** `RosettaCore` engine over **real**
college department concepts — closing the selector-caller symmetry gap and, with it,
GAP-2.

## What shipped

- **The selector wire proof** (`tests/integration/selector-rosetta-fallback-wire.integration.test.ts`,
  NEW, 5 tests): the orchestration `ActivationSelector` (second production caller of
  the `ConceptFallbackProvider` pattern, `src/orchestration/selector.ts:401`, v1.49.832)
  previously had only unit coverage against a mock provider. This test wires a real
  `RosettaConceptFallback` over a real `ConceptRegistry` + `RosettaCore` (real
  `PanelRouter` + `ExpressionRenderer` + panels) populated with the real
  `theo-creation-narratives` (theology) and `astro-cosmology` (astronomy) concepts,
  activates a low-confidence skill through `select()`, and asserts the fire-and-forget
  fallback produces a real cross-domain analogy suggestion (`conceptId:
  'astro-cosmology'`, `via: 'rosetta-analogy'`). It also proves the real-data
  fail-soft branch (a concept with no cross-domain `analogy` → `null`) and that the
  real engine renders an **empty-panel** concept via the natural-language fallback
  (a translate path neither the copper spy nor the `.college` roundtrip test ever ran).

- **GAP-2 reconciliation** (`.planning/PROJECT.md`, local-only): GAP-2 → **CLOSED**.
  Both production callers of the cross-rootdir concept-fallback wire now have
  application-boundary integration tests proving the loop queries the college on
  low-confidence — copper (v832) and selector (v929).

- **Discipline doc** (`docs/cross-rootdir-wire-discipline.md`): new corollary section
  documenting that an organic `src/` composition root constructing a `.college/`
  provider is **architecturally N/A** — the boundary is enforced asymmetrically
  (`src/`→`.college/` is a hard tsc `rootDir` error; `.college/`→`src/` is not
  tsc-caught but is discipline-forbidden and runtime-fragile), so neither rootdir
  hosts a sound composition root and the integration test (step 4) IS the
  consume-axis closure. The adversarial verify surfaced one latent `.college/`→`src/`
  dead-code import (`runbook-interface.ts`); it is documented as a cleanup candidate,
  not fixed in this verify-axis ship.

## Verification

- 5 new tests pass; **mutation-proven** load-bearing — disabling the selector's
  `onLowConfidence` call (`if (false && fallback)`) turns 2 tests red (`captured.length`
  0≠1); reverted via git.
- `tsc --noEmit` clean (the new file's cross-rootdir imports type-check under the
  vitest `integration` project).
- Sibling tests green (copper integration + selector unit, 23/23) — no regression;
  no production `src/` code changed.

## Engine state

NASA degree **1.178** (unchanged). Counter-cadence **20** (unchanged — verify-axis
forward work, not a cleanup-mission). Manifest **150** (no new lesson — mirrors
#10435 cross-rootdir wire + #10438 verify axis). Architecture gaps: GAP-1/4/6 CLOSED,
GAP-2 **CLOSED (v929)**, GAP-3/5 intentional, GAP-7 open → **6/7 closed-or-intentional**.
