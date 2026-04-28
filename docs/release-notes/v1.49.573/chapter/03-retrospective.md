# Retrospective — v1.49.573

## What Worked

- **The two-half tier-gated pattern shipped a third time, at greater scale.** v1.49.570 proved "two halves." v1.49.571 proved "CAPCOM hard gates in Half B." v1.49.572 proved "tier-gated Half B." v1.49.573 proves the pattern composes at 24 phases / 11 waves / 7 parallel research tracks / 10 substrate modules without breaking. The pattern is now the project's default-shape for any milestone whose research surface exceeds 5 modules.

- **Convergent-discovery enumeration as a first-class deliverable.** `synthesis-convergent-discovery.tex` (Phase 763) is the v1.49.573 deliverable that future milestones will cite when defending architectural choices. Convergent discovery from external peer-reviewed work is stronger external validation than internal-team review; it's also less ambiguous than citing one's own prior decisions.

- **Per-paper integration-target + risk-class discipline.** Each of the 150 papers in M1-M7 carries methodology contribution + GSD component + integration risk class (Low/Medium/High/Unknown with justification) + test pattern. The Phase 757/758/759/760/761/762 audits all cleared on first attempt with no "TBD risk" rows leaking into synthesis. Cost ~+20% in module-agent token spend but kept W2 synthesis from being a survey-level summary.

- **The cultural-sensitivity audit gate (G2 / Phase 758) was testable.** `m3-cultural-sensitivity-report.tex` ran a checklist against 2604.19763 + 2604.17248 methodology applied to OCAP / CARE / UNDRIP. Every Indigenous-knowledge reference in M3 names the specific nation; zero generic framing leaked through; population-level treatment for endangered species; no GPS coordinates or breeding-site detail.

- **The pre-rollout threat-model gate (G3 / Phase 759) was paper-grounded.** `m4-mia-threat-model.tex` blocks any future federated-training path until the design document addresses the Lee et al. trio with four mandatory mitigations. The substrate version (`src/fl-threat-model/`, T1d, Phase 768) shipped at 115 tests vs 15 floor (7.67x) including 15 block-on conditions and a YAML validator. The discipline of "audit the threat model before writing any FL code" worked.

- **The four hard-preservation gates passed first attempt.** G10/G11/G12/G13 all cleared on first attempt because the precedent pattern from v1.49.571/572 was reused verbatim. The 153-file SHA-256 hash-tree fixture added a stronger byte-identical proof at G14 closure than prior milestones had.

- **Wave 1 over-delivery.** Module agents and substrate-module agents consistently delivered 2-8x the test floors. Not gold-plating -- each module's test count is bounded by the natural test surface of the methodology it implements. The over-delivery produced the +576 itemized / +712 raw delta against a +94 itemized / +100 raw floor.

- **Full-autonomous execution between CAPCOM gates.** Half B's 10 substrate modules built without a single human gate touch -- all seven Half B CAPCOM gates passed automatically with their declared verification artifacts. Gates carry the human-authorization weight, autonomy carries the build weight, and the seam between them is well-defined.

- **T3 SHIPPED, not deferred (a second time).** Same call as v1.49.572 Tonnetz. T1 + T2 closed with 8.6x and 4.4x cumulative multipliers respectively; the autonomous run had budget; T3 Stackelberg + Rumor-Delay shipped as a bonus rather than carried into a future milestone.

## What Could Be Better

- **Cross-module path drift at W1 entry (3 of 7 agents).** Three Wave-1 agents (M2, M6, M7) wrote their first-pass `.tex` files to `work/modules/` instead of `work/templates/`. The drift was semantic -- the agents interpreted "module file" as belonging in a `modules/` directory rather than the explicitly-pinned `work/templates/`. Caught and consolidated at W2 entry; no work was lost; cost ~10 minutes of consolidation each.

- **tsc duplicate `classifyLevel` warnings during T2.** During the T2 build (Phase 769-772 parallel), `npx tsc --noEmit` produced transient duplicate-symbol warnings for the `classifyLevel` function (used in T2a Experience Compression and surface-imported by T2b for prediction prior weighting). Cleared on T2a completion. Avoidable with prior coordination.

- **The 2 pre-existing math-foundations failures were inherited from v1.49.572.** `src/mathematical-foundations/__tests__/integration.test.ts` carries 2 failures from v1.49.572 baseline (live-config flag-state checks). Surfaced at every Phase 769-778 run as a noisy "2 failed" line that agents had to repeatedly diagnose-as-pre-existing. Honest fix would have been a Phase-769.1 cleanup.

- **Skilldex convergence was older than realised.** Skilldex (`eess26_2604.16911`) IS the ZFC compliance auditor we'd been planning to build for ~6 milestones (since v1.49.566 or so). Convergent discovery as direct architectural validation, not just citation: the paper landed in our research window and the methodology we'd been independently iterating toward came back to us in peer-reviewed form.

- **Wave 1 floors under-specified what good work looks like.** Floors are floors. The seven module agents averaged 2-7x target test counts -- not because the agents were over-engineered, but because each methodology has a natural test surface that the floor under-specified. Lesson: floors should be set by methodology surface, not by uniform sub-target heuristics.

## Lessons Learned

# v1.49.573 Retrospective — Upstream Intelligence Pack v1.44 (ArXiv eess Integration)

**Closed:** 2026-04-24 on `dev` (status `ready_for_review`; human merge to `main` remains gated)
**Phases shipped:** 24 (755 → 778)
**Waves:** 11 (W0 → W11)
**Tests delivered:** **+712** over the published v1.49.572 baseline (26,699 → 27,411). Itemized to 11 new test clusters: **+576** (4.11× the ≥140 itemized floor; 5.76× the ≥100 milestone floor in CI-equivalent conditions); **+136** additional tests run locally where `www/tibsfox/com/Research/` assets are present. Aggregate raw delta **7.12× the ≥100 floor**.
**Regressions attributable to v1.49.573:** 0
**Pre-existing failures (carried forward, NOT v1.49.573's):** 2 in `src/mathematical-foundations/__tests__/integration.test.ts`
**CAPCOM gates:** 16 of 16 PASS / AUTHORIZED — G0–G14 all PASS · G15 Final AUTHORIZED — including 4 HARD preservation gates (G10/G11/G12/G13) + 1 HARD composition gate (G14) + 1 Safety Warden BLOCK (G7)
**Duration:** single-session autonomous execution between CAPCOM gate boundaries (user authorization 2026-04-24)
**Model mix:** Opus for research-paper phases (M1–M7), W2 synthesis, hard-gate audits, retrospective, dedication; Sonnet for scaffold / module substrate / W9 integration / regression report / README / manifest / archive work; Haiku for W0 foundation

---
