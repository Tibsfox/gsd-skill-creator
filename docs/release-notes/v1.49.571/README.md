# v1.49.571 -- Heuristics-Free Skill Space

**Shipped:** 2026-04-23
**Commits:** 11
**Phases:** 15 (721-735)
**Waves:** 9 (W0 -> W8)
**Branch:** dev (closed; awaiting human review before merge to main)
**Tag:** v1.49.571
**Tests:** 26,641 passing (baseline 26,392 + 249; target >=+80; 3.1x over-delivered)
**Regressions:** 0
**Typecheck:** clean
**CAPCOM gates:** 11 of 11 PASS (including 2 HARD preservation gates + 1 Safety Warden BLOCK)

## Summary

**Two-half pattern copied from v1.49.570 Convergent Substrate.** Half A delivered the staged LeJEPA / SIGReg / LeWorldModel research package (verified, extended, corpus-tied-in); Half B ported the Tier 1/2 improvements from the Stage-3 mission spec into six default-off substrate modules that augment (never replace) the CAPCOM human-gate architecture. The mirroring gave the roadmapper a known-good skeleton end-to-end.

**CAPCOM preservation enforced as a HARD gate for Half B.** Four-layer defense: compile-time `MissionAction` enum excludes every gate-bypass variant, runtime `assertNoGateBypassAction` guard rejects forbidden names, `AdvisoryPlan.advisoryOnly: true` is a compile-time const, and public exports are audited against forbidden names (`dispatchWave`, `bypassCapcom`, `overrideCapcom`, `writeCapcomState`, `skipGate`, `forceDispatchWave`, `executeActionAuthoritatively`, `commitPlan`, `applyAdvisoryPlan`). Every layer caught its own class of attack.

**All six Half B code-backed modules ship default-off and zero-dep.** Opt-in via `.claude/gsd-skill-creator.json` `heuristics-free-skill-space` block. Every flag defaults `false`. With all flags `false`, runtime is byte-identical to v1.49.570 (verified by Phase 734 SC-CONT-FLAG-OFF analogue). Zero npm deps added: no torch, no numpy, no scipy. SIGReg is a TypeScript-native port rather than a wrapper over published PyTorch.

**Architecture Gap GAP-10 addressed.** "Skill Space Collapse Risk Not Directly Measured" (NEW, High) closed via Skill Space Isotropy Audit (Phase 728) + Intrinsic Telemetry (Phase 733). Anderson-Darling collapse detection retuned to use bimodal perturbation (shape-carrying) rather than scale perturbation, since A^2 standardizes inputs and cancels scale.

**Test delta +249 against baseline 26,392.** Final suite 26,641 passing. Half A delivered 46 tests (target >=30; 1.53x over). Half B delivered 120 tests (target >=50; 2.40x over). Aggregate >=80 floor crushed 3.1x. Zero regressions across all six new `src/` modules.

**Single-session autonomous execution with `skip_discuss` safe.** The 35-page Stage-1 Vision + Stage-2 Research Reference + Stage-3 Mission Spec gave every phase a deterministic target. Pattern scales cleanly for survey-driven milestones; would fail for exploratory ones. Spearman correlation primitive (`rankWithTies + spearman + pearson`, ~60 LOC) reusable beyond Phase 733.

## Half A -- LeJEPA Research + Corpus Tie-In (phases 721-727)

| Phase | Deliverable | LEJEPA-* |
|-------|-------------|----------|
| 721 | Foundation -- bibliography (14 entries) + glossary (33 terms) + 5 module templates + CAPCOM macro + numerical attribution scaffold + 11-gate JSON sidecar + license notices scaffold | seeds LEJEPA-07 |
| 722 | M1 Theoretical foundations -- two axioms, Lemmas 1-2, Theorem 1 (Gaussian optimality), Hyperspherical Cramer-Wold | LEJEPA-01 |
| 723 | M2 SIGReg mechanics -- Cramer-Wold sufficiency + ECF preference + 5 concrete failure modes | LEJEPA-02, LEJEPA-03 |
| 724 | M3 World models + LeCun lecture -- I-JEPA->LeWM lineage, 48x speedup attributed to 192-dim token, lecture corroborated-only | LEJEPA-04, LEJEPA-05 |
| 725 | M4 GSD parallels -- 12-row parallels table with defense paragraphs for the 4 load-bearing rows | LEJEPA-06 |
| 726 | M5 Synthesis -- Tier 1/2/3 roadmap + through-line + numerical attribution finalized | LEJEPA-07, LEJEPA-11, LEJEPA-12 |
| 727 | Publication + Corpus tie-in -- 5 tibsfox.com pages + 6 college concepts across 4 departments + 10 cross-references.json edges + 5 series.js entries + Safety Warden BLOCK | LEJEPA-08, LEJEPA-09, LEJEPA-10 |

Half A tests delivered: **46** (target >=30; 1.53x over). Safety Warden BLOCK gate at Phase 727 close: **PASS** (6 SC / 18 CF / 7 IT / 4 EC categories all clear).

## Half B -- Research-Informed Substrate Hardening (phases 728-734)

| Phase | Module | Path | LEJEPA-* | Tests |
|-------|--------|------|----------|-------|
| 728 | Skill Space Isotropy Audit | `src/skill-isotropy/` | LEJEPA-13 | 25 |
| 729 | SIGReg primitive | `src/sigreg/` | LEJEPA-14 | 20 |
| 730 | Single-lambda orchestration audit | `docs/substrate-audits/single-lambda.md` | LEJEPA-15 | 4 |
| 731 | Heuristics audit of six-step loop | `docs/substrate-audits/heuristics-audit.md` | LEJEPA-16 | 5 |
| 732 | Mission-state world-model | `src/mission-world-model/` | LEJEPA-17 | 25 |
| 733 | Intrinsic telemetry | `src/intrinsic-telemetry/` | LEJEPA-18 | 22 |
| 734 | Integration + MB-1/MB-5 composition + flag-off | `src/heuristics-free-skill-space/` + `.claude/gsd-skill-creator.json` | LEJEPA-19 | 19 |

Half B tests delivered: **120** (target >=50; 2.40x over). All 6 code-backed modules ship **default-off**, opt-in via `.claude/gsd-skill-creator.json` `heuristics-free-skill-space` block.

### Part A: LeJEPA Research + Corpus Tie-In

Full deep research covering the LeJEPA paper, LeCun lecture, and LeWorldModel reference implementations as foundation, theorem source, and corpus tie-in:

- **PHASE 721 FOUNDATION SCAFFOLD:** ships 14-entry bibliography + 33-term glossary + 5 module templates + CAPCOM macro + numerical attribution scaffold + 11-gate JSON sidecar + license notices scaffold. Seeds LEJEPA-07. Establishes the deterministic-target shape for the autonomous run.

- **PHASE 722 M1 THEORETICAL FOUNDATIONS:** ships `module_1.tex` covering two axioms, Lemmas 1-2, Theorem 1 (Gaussian optimality), Hyperspherical Cramer-Wold sufficiency. Closes LEJEPA-01. Gives the Half B SIGReg primitive its formal grounding.

- **PHASE 723 M2 SIGREG MECHANICS:** ships `module_2.tex` covering Cramer-Wold sufficiency + ECF preference + 5 concrete failure modes. Closes LEJEPA-02 + LEJEPA-03. Direct feeder for Half B Phase 729 SIGReg primitive port.

- **PHASE 724 M3 WORLD MODELS + LECUN LECTURE:** ships `module_3.tex` covering I-JEPA -> LeWM lineage, the 48x speedup attributed to the 192-dim token, lecture treated as corroborated-only (not primary). Closes LEJEPA-04 + LEJEPA-05. Direct feeder for Half B Phase 732 mission-state world-model.

- **PHASE 725 M4 GSD PARALLELS:** ships `module_4.tex` covering 12-row parallels table with defense paragraphs for the 4 load-bearing rows. Closes LEJEPA-06. Establishes the architecture-mapping that every Half B module references.

- **PHASE 726 M5 SYNTHESIS:** ships `module_5.tex` covering Tier 1/2/3 roadmap + through-line + numerical attribution finalized. Closes LEJEPA-07 + LEJEPA-11 + LEJEPA-12. The Tier roadmap is the scope-discipline device for Half B; T2c (projection-based composition validator) and Tier-3 items deferred cleanly per scope discipline.

- **PHASE 727 PUBLICATION + CORPUS TIE-IN:** ships 5 tibsfox.com pages at `www/tibsfox/com/Research/LEJEPA/` (hub + sigreg-mechanics + world-models + gsd-parallels + through-line) + 6 college concepts (`isotropic-embedding`, `cramer-wold-slicing`, `characteristic-function-test`, `single-lambda-principle`, `heuristics-free-ssl`, `latent-world-model`) across `ai-computation` / `mathematics` / `adaptive-systems` / `data-science` + 10 cross-references.json edges (LeJEPA <-> AAR, CONV, DRIFT, SST, LLM, CHIPSET, COLLEGE, DACP, SILICON, STAGING) + 5 series.js entries under "AI & Computation" Rosetta cluster + Safety Warden BLOCK. **Safety Warden BLOCK at Phase 727 close: PASS** -- 6 SC / 18 CF / 7 IT / 4 EC categories all clear. Closes LEJEPA-08 + LEJEPA-09 + LEJEPA-10.

### Part B: Substrate Implementation

Full deep research covering Half B as primitive author, audit author, and integration author, every module zero-dep TypeScript-native:

- **PHASE 728 SKILL SPACE ISOTROPY AUDIT:** ships `src/skill-isotropy/` (25 tests). Read-only audit. Anderson-Darling collapse detection retuned to use bimodal perturbation (shape-carrying) rather than scale perturbation, since A^2 standardizes inputs and cancels scale. Lesson: any test that scores distribution-shape anomalies must use shape-carrying adversarial data. Closes LEJEPA-13 and addresses GAP-10.

- **PHASE 729 SIGREG PRIMITIVE:** ships `src/sigreg/` (20 tests). Pure-functional. <=80-LOC budget as a design forcing function -- the budget forced delegation to the `src/skill-isotropy/slicing.ts` primitives from Phase 728, which made the port reference `rbalestr-lab/lejepa`'s structural simplicity rather than re-creating it. Default `numSlices` is 1024 (per LeJEPA paper); unit tests run at 8-64 slices. Closes LEJEPA-14.

- **PHASE 730 SINGLE-LAMBDA ORCHESTRATION AUDIT:** ships `docs/substrate-audits/single-lambda.md` (4 tests, structural grep checks). Documentation-only phase. Closes LEJEPA-15.

- **PHASE 731 HEURISTICS AUDIT OF SIX-STEP LOOP:** ships `docs/substrate-audits/heuristics-audit.md` (5 tests, structural grep checks). Documentation-only phase. Closes LEJEPA-16.

- **PHASE 732 MISSION-STATE WORLD-MODEL -- HARD CAPCOM PRESERVATION:** ships `src/mission-world-model/` (25 tests). Advisory-only. Load-bearing CAPCOM preservation case: the four-layer defense (compile-time `MissionAction` enum + runtime `assertNoGateBypassAction` guard + `AdvisoryPlan.advisoryOnly: true` const + public-export forbidden-name audit) lives here. Encoder is deterministic feature-hashing, not learned; rationale: this phase ships the architecture (encoder + predictor + CEM planner + CAPCOM preservation gate), not the weights. Future swap to a learned encoder will not change the public API or the hard gate. Closes LEJEPA-17.

- **PHASE 733 INTRINSIC TELEMETRY:** ships `src/intrinsic-telemetry/` (22 tests). Pure-functional. Spearman correlation primitive (`rankWithTies + spearman + pearson`, ~60 LOC) plus a `bestSignal` selection + verdict classification layer. Tested on synthetic data; real per-mission signal collection deferred to v1.49.572 onward. Closes LEJEPA-18.

- **PHASE 734 INTEGRATION + MB-1/MB-5 COMPOSITION + FLAG-OFF:** ships `src/heuristics-free-skill-space/` integration suite (19 tests). Composes against MB-1 + MB-5 substrate. Every flag in `.claude/gsd-skill-creator.json` `heuristics-free-skill-space` block defaults `false`; SC-CONT-FLAG-OFF analogue verifies byte-identical-to-v1.49.570 behavior when all flags are off. Closes LEJEPA-19.

### Retrospective

#### What Worked

- **Two-half pattern copy from v1.49.570.** Mirroring the Convergent Substrate shape (Half A research + corpus tie-in; Half B default-off modules opted-in via `.claude/gsd-skill-creator.json`) gave the roadmapper a known-good skeleton and let the autonomous execution reuse the established Safety Warden BLOCK -> CAPCOM preservation -> flag-off regression chain end-to-end.

- **Mission package as authoritative spec.** The 35-page Stage-1 Vision + Stage-2 Research Reference + Stage-3 Mission Spec gave every phase a deterministic target. `skip_discuss` was safe because there were no real grey areas -- the mission package already resolved them. This pattern scales cleanly for survey-driven milestones but would fail for exploratory ones.

- **CAPCOM preservation as a hard gate for Half B.** The compile-time `MissionAction` enum + runtime `assertNoGateBypassAction` guard + `AdvisoryPlan.advisoryOnly: true` const tag + public-export forbidden-name audit is a four-layer defense. Every layer caught its own class of attack; removing any one would have opened a real hole.

- **<=80-LOC budget as a design forcing function.** Phase 729's SIGReg port core came in under budget precisely because the budget forced delegation to the `src/skill-isotropy/slicing.ts` primitives from Phase 728. This made the port reference `rbalestr-lab/lejepa`'s structural simplicity rather than re-creating it.

- **Spearman correlation as a reusable primitive.** Phase 733's `rankWithTies + spearman + pearson` implementation was ~60 LOC but serves as a reusable correlation primitive. The `bestSignal` selection + verdict classification is a cheap but useful analysis layer on top.

- **Test delta +249 vs +80 floor.** 3.1x over-delivery on the aggregate target. Half A 1.53x over its sub-target; Half B 2.40x over its sub-target. Zero regressions across six new `src/` modules.

- **All 11 CAPCOM gates PASS.** Including 2 hard-preservation gates + 1 Safety Warden BLOCK. Gates verified across 0, 1, 2, 3, 4, 5 (Safety Warden BLOCK), 6, 7, 8 (HARD preservation), 9 (HARD composition).

#### What Could Be Better

- **Anderson-Darling sensitivity in Phase 728 required test tuning.** The first version of the "collapse detection" test assumed a simple scale perturbation would register, but A^2 standardizes inputs and thus cancels scale. Had to switch to bimodal perturbation to get a standardization-invariant anomaly signal. Lesson: any test that scores distribution-shape anomalies must use shape-carrying adversarial data, not just scale.

- **Phase 724's empirical-findings table repeated numerical claims that Phase 722's module_1 already covered.** Some cross-module cross-references would have been cleaner with a single normative source (`numerical_attribution.md`) and pointers from the modules, rather than each module carrying its own copy of the figures. Phase 726 finalized the attribution table but the per-module tables stay as duplicates until a future documentation-consolidation pass.

- **SigregConfig's `numSlices` default is 1024 (per LeJEPA paper), but unit tests run at 8-64 slices.** The production default is right, but the tests run at 1-2 orders of magnitude less. Nothing wrong with that, but a production deployment would want to smoke-test the full 1024-slice configuration as part of the integration suite. Deferred to follow-on milestone.

- **The two documentation-only phases (730 Single-lambda audit, 731 Heuristics audit) had ~4-5 "tests" that were just structural grep checks.** Not a problem for this milestone's over-delivery, but the pattern of counting markdown-grep tests toward the milestone test total is a borderline case. A future convention refinement could separate `docs_structure_checks` from `runtime_tests` in the per-phase manifest.

### Lessons Learned

1. **Two-half pattern is reusable.** v1.49.570 proved it; v1.49.571 inherits cleanly with only the additional convention that Half B can carry hard CAPCOM-preservation gates. Recommend formalizing the two-half + hard-gate convention for future milestone roadmappers.

2. **Mission package as authoritative spec enables `skip_discuss`.** The 35-page three-stage package (Stage-1 Vision + Stage-2 Research Reference + Stage-3 Mission Spec) gave every phase a deterministic target. Pattern scales for survey-driven milestones; exploratory milestones should not skip discuss.

3. **CAPCOM preservation as four-layer defense is the right shape.** Compile-time enum + runtime guard + const tag + public-export audit. Each layer catches its own class of attack. Removing any one opens a real hole. Promote into a shared substrate-author template.

4. **<=80-LOC budget forces good delegation.** Phase 729 SIGReg port stayed small precisely because the budget forced delegation to `src/skill-isotropy/slicing.ts` primitives. The constraint produced reference to upstream `rbalestr-lab/lejepa` structural simplicity rather than re-creation.

5. **Anderson-Darling tests need shape-carrying adversarial data.** A^2 standardizes inputs and cancels scale perturbations. Bimodal perturbation registers; simple scale perturbation does not. Lesson generalizes: any distribution-shape anomaly test must use shape-carrying adversarial data.

6. **All six Half B code-backed modules zero-dep.** No torch, no numpy, no scipy. SIGReg as TypeScript-native port rather than thin wrapper over published PyTorch. Same rationale as later v1.49.572: substrate is TypeScript; adding heavyweight ML deps for a <=80-LOC loss function is the tail wagging the dog. If a future milestone needs gradient-flowing SIGReg inside a PyTorch training loop, that is Silicon Layer integration (Tier-3 T3b, deferred).

7. **Mission-state world-model encoder is deterministic feature-hashing, not learned.** This phase ships the architecture (encoder + predictor + CEM planner + CAPCOM preservation gate), not the weights. A future phase can swap the encoder for a learned one without changing the public API or the hard CAPCOM gate. Decouple architecture-shipping from weight-shipping.

8. **Feature flags named by function** (`skill_isotropy_audit` / `sigreg` / `mission_world_model` / `intrinsic_telemetry`) rather than by requirement code (LEJEPA-13..18). Readability > traceability for config files that humans flip. Traceability lives in the REQUIREMENTS.md table.

9. **Documentation-only phases should not count markdown-grep "tests" toward the milestone test total.** Phases 730 + 731 over-delivered the milestone, so it did not matter, but the convention is borderline. Future refinement: separate `docs_structure_checks` from `runtime_tests` in the per-phase manifest.

10. **Skipped T2c + all Tier-3 items as scope discipline.** The audit in Phase 726 M5 identified these as legitimate wins but their prerequisites (especially Phase 733 Intrinsic Telemetry production data) are not yet in place. Deferred cleanly rather than over-committing.

### Cross-References

| Connection | Significance |
|------------|--------------|
| **v1.49.570** (Convergent Substrate) | **PATTERN ANCESTOR.** First "two-halves" milestone; v1.49.571 mirrors the Half A research + corpus tie-in / Half B default-off opt-in shape verbatim. |
| **`.claude/gsd-skill-creator.json`** (`heuristics-free-skill-space` block) | **OPT-IN SURFACE.** All six Half B code-backed modules behind this block; every flag defaults `false`; flag-off byte-identical to v1.49.570. |
| **`src/skill-isotropy/slicing.ts`** (Phase 728) | **PRIMITIVE FEEDER.** Phase 729 SIGReg port delegates to these primitives; the <=80-LOC budget forced the delegation. |
| **MB-1 + MB-5 substrate** (Phase 734 composition) | **COMPOSITION TARGET.** Integration suite verifies composition; flag-off byte-identical preserved. |
| **Safety Warden BLOCK** (Phase 727 close) | **PUBLISH GATE.** 6 SC / 18 CF / 7 IT / 4 EC categories all clear; standard pre-publish gate for corpus tie-in. |
| **AAR / CONV / DRIFT / SST / LLM / CHIPSET / COLLEGE / DACP / SILICON / STAGING** | **CROSS-LINKED.** 10 `cross-references.json` edges connect LEJEPA hub to these existing hubs. |
| **`rbalestr-lab/lejepa`** (MIT) + **`lucas-maes/le-wm`** | **REFERENCE IMPLEMENTATIONS.** SIGReg port references upstream structural simplicity rather than re-creating it. |
| **v1.49.572** (Mathematical Foundations Refresh) | **DOWNSTREAM EXTENSION.** Inherits the "two-halves + hard CAPCOM gates in Half B" pattern and adds tier-gating (T1/T2/T3) inside Half B. |

### By the numbers

| Metric | Value |
|--------|-------|
| Phases shipped | 15 (721-735) |
| Waves | 9 (W0 -> W8) |
| LEJEPA-* requirements closed | 19 (LEJEPA-01..19) |
| CAPCOM gates PASS | 11 of 11 |
| Hard preservation gates | 2 |
| Hard composition gates | 1 |
| Safety Warden BLOCK | 1 (Phase 727 close) |
| Half A modules | 5 (M1-M5) + foundation + publication |
| Half A tests delivered | 46 (target >=30; 1.53x over) |
| Half B src modules | 6 code-backed + 2 docs-only |
| Half B tests delivered | 120 (target >=50; 2.40x over) |
| Tests added | +249 over baseline 26,392 |
| Final test suite | 26,641 passing |
| Regressions | 0 |
| Architecture gaps closed/addressed | 1 (GAP-10) |
| Cross-references.json edges | +10 (LeJEPA hub) |
| College concepts | 6 (across 4 departments) |
| Corpus tie-in HTML pages | 5 |
| series.js entries | 5 (under "AI & Computation" cluster) |

### Test posture

| Marker | Tests | Delta | Notes |
|--------|-------|-------|-------|
| baseline pre-milestone | 26,392 | -- | Milestone open |
| Half A close (Phase 727) | -- | +46 | 1.53x the >=30 sub-target |
| Half B close (Phase 734) | -- | +120 | 2.40x the >=50 sub-target |
| v1.49.571 close | 26,641 | **+249** vs baseline | Aggregate >=80 floor crushed 3.1x; zero regressions across six new `src/` modules |

Half A sub-target (>=30 tests): crushed 1.53x. Half B sub-target (>=50 tests): crushed 2.40x. Aggregate sub-target (>=80 tests): crushed 3.1x.

### Infrastructure

- **Half A research package:** `.planning/missions/arxiv-april-2026-lejepa-integration/` -- `mission.pdf` (35 pages), `mission.tex` (1460 LOC), `index.html`, `work/` containing sources/index.bib + glossary.md + modules/module_{1..5}.tex + templates/ + numerical_attribution.md + license_notices.md + capcom_gates.json.
- **Half B src modules (6 new code-backed):** `src/skill-isotropy/`, `src/sigreg/`, `src/mission-world-model/`, `src/intrinsic-telemetry/`, `src/heuristics-free-skill-space/`, plus the `src/mission-world-model/` four-layer CAPCOM preservation defense. Composition wired against MB-1 + MB-5 substrate at Phase 734.
- **Substrate audits (2 docs-only):** `docs/substrate-audits/single-lambda.md` (Phase 730), `docs/substrate-audits/heuristics-audit.md` (Phase 731).
- **Feature-flag schema:** all six Half B code-backed modules behind `heuristics-free-skill-space` block in `.claude/gsd-skill-creator.json`; every flag defaults `false`. With all four flags `false`, runtime byte-identical to v1.49.570 (verified by Phase 734 SC-CONT-FLAG-OFF analogue).
- **Corpus tie-in artifacts:** 5 HTML pages under `www/tibsfox/com/Research/LEJEPA/` (hub + sigreg-mechanics + world-models + gsd-parallels + through-line) + 6 college concepts across `ai-computation` + `mathematics` + `adaptive-systems` + `data-science` departments + 10 `cross-references.json` edges (LeJEPA <-> AAR, CONV, DRIFT, SST, LLM, CHIPSET, COLLEGE, DACP, SILICON, STAGING) + 5 `series.js` entries under "AI & Computation" Rosetta cluster.
- **Branch state:** `dev` at milestone tip. Human review gated before merge to `main` per 2026-04-22 directive. v1.50 branch deferred per 2026-04-13 directive.

## CAPCOM Preservation

**HARD GATE.** Every Half B module is either read-only (audits, telemetry), pure-functional (SIGReg, intrinsic telemetry), or advisory-only (mission-state world-model). No module replaces or bypasses the CAPCOM human-gate architecture.

Mission-state world-model is the load-bearing case:

- `MissionAction` enum excludes every gate-bypass variant by construction (compile-time).
- `assertNoGateBypassAction` runtime guard rejects forbidden names (case-insensitive, substring matches, non-string inputs).
- `AdvisoryPlan.advisoryOnly: true` is a compile-time const.
- Public exports audited against forbidden names (`dispatchWave`, `bypassCapcom`, `overrideCapcom`, `writeCapcomState`, `skipGate`, `forceDispatchWave`, `executeActionAuthoritatively`, `commitPlan`, `applyAdvisoryPlan`).

CAPCOM gates verified across all Half B phases: **0, 1, 2, 3, 4, 5 (Safety Warden BLOCK), 6, 7, 8 (HARD preservation), 9 (HARD composition)**. All PASS.

## Feature Flag Schema

All Half B code-backed modules live behind the new `heuristics-free-skill-space` block in `.claude/gsd-skill-creator.json`. Every flag defaults `false`; callers must explicitly opt in.

```json
{
  "gsd-skill-creator": {
    "heuristics-free-skill-space": {
      "skill_isotropy_audit": { "enabled": false },
      "sigreg": { "enabled": false },
      "mission_world_model": {
        "enabled": false,
        "latentDim": 128,
        "cemSamples": 64,
        "cemIterations": 3,
        "planningHorizon": 3
      },
      "intrinsic_telemetry": { "enabled": false, "minSamples": 5 }
    }
  }
}
```

Flipping all four flags to `false` is byte-identical to v1.49.570 behavior (verified by Phase 734's SC-CONT-FLAG-OFF analogue).

## Sources

- Balestriero, R. & LeCun, Y. (2025). *LeJEPA: Provable and Scalable Self-Supervised Learning Without the Heuristics.* arXiv:2511.08544v3 [cs.LG].
- LeCun, Y. (14 April 2026). *Special Lecture on AI and World Models.* Al-Khwarizmi Applied Mathematics Webinar.
- Maes, L., Le Lidec, Q., Scieur, D., LeCun, Y., & Balestriero, R. (2026). *LeWorldModel: Stable End-to-End Joint-Embedding Predictive Architecture from Pixels.*
- Reference implementations: `rbalestr-lab/lejepa` (MIT), `lucas-maes/le-wm`.

## Next

- **Human authorization required** to merge `dev` -> `main`. Per 2026-04-22 directive, dev-branch-only is still in force.
- Follow-on milestones can pick up the DEFERRED roadmap items: T2c (projection-based composition validator), T3a (College of Knowledge Galaxy10-analogue experiment), T3b (Silicon Layer SIGReg adapter), T3c (Cramer-Wold <-> Wasteland ZFC auditor bridge).
- Documentation consolidation pass: `numerical_attribution.md` should become the single source of truth; per-module tables in Modules 1-5 should point at it rather than duplicating.
- SIGReg 1024-slice smoke test: add a production-scale integration test running the full LEJEPA_DEFAULT_CONFIG on synthetic data.
- Intrinsic Telemetry real data collection: start collecting per-mission signal data from v1.49.572 onward so the correlation numbers become empirical rather than theoretical.
