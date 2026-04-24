# v1.49.571 Retrospective — Heuristics-Free Skill Space

**Closed:** 2026-04-23 on `dev`
**Phases shipped:** 15 (721 → 735)
**Waves:** 9 (W0 → W8)
**Tests delivered:** +249 over baseline 26,392 (final suite 26,641; target ≥+80; 3.1× over)
**Regressions:** 0
**CAPCOM gates:** 11 of 11 PASS (including 2 HARD preservation gates + 1 Safety Warden BLOCK)
**Duration:** single-session autonomous execution

## What Worked

1. **Two-half pattern copy from v1.49.570.** Mirroring the Convergent Substrate shape (Half A research + corpus tie-in; Half B default-off modules opted-in via `.claude/gsd-skill-creator.json`) gave the roadmapper a known-good skeleton and let the autonomous execution reuse the established Safety Warden BLOCK → CAPCOM preservation → flag-off regression chain end-to-end.

2. **Mission package as authoritative spec.** The 35-page Stage-1 Vision + Stage-2 Research Reference + Stage-3 Mission Spec gave every phase a deterministic target. `skip_discuss` was safe because there were no real grey areas — the mission package already resolved them. This pattern scales cleanly for survey-driven milestones but would fail for exploratory ones.

3. **CAPCOM preservation as a *hard* gate for Half B.** The compile-time `MissionAction` enum + runtime `assertNoGateBypassAction` guard + `AdvisoryPlan.advisoryOnly: true` const tag + public-export forbidden-name audit is a four-layer defense. Every layer caught its own class of attack; removing any one would have opened a real hole.

4. **≤80-LOC budget as a design forcing function.** Phase 729's SIGReg port core came in under budget precisely because the budget forced delegation to the `src/skill-isotropy/slicing.ts` primitives from Phase 728. This made the port reference `rbalestr-lab/lejepa`'s structural simplicity rather than re-creating it.

5. **Spearman correlation as a reusable primitive.** Phase 733's `rankWithTies + spearman + pearson` implementation was ~60 LOC but serves as a reusable correlation primitive. The `bestSignal` selection + verdict classification is a cheap but useful analysis layer on top.

## What Could Go Better

1. **Anderson-Darling sensitivity in Phase 728 required test tuning.** The first version of the "collapse detection" test assumed a simple scale perturbation would register, but A² standardizes inputs and thus cancels scale. Had to switch to bimodal perturbation to get a standardization-invariant anomaly signal. Lesson: any test that scores distribution-shape anomalies must use shape-carrying adversarial data, not just scale.

2. **Phase 724's empirical-findings table repeated numerical claims that Phase 722's module_1 already covered.** Some cross-module cross-references would have been cleaner with a single normative source (numerical_attribution.md) and pointers from the modules, rather than each module carrying its own copy of the figures. Phase 726 finalized the attribution table but the per-module tables stay as duplicates until a future documentation-consolidation pass.

3. **SigregConfig's `numSlices` default is 1024 (per LeJEPA paper), but unit tests run at 8–64 slices.** The production default is right, but the tests run at 1–2 orders of magnitude less. Nothing wrong with that, but a production deployment would want to smoke-test the full 1024-slice configuration as part of the integration suite. Deferred to follow-on milestone.

4. **The two documentation-only phases (730 Single-λ audit, 731 Heuristics audit) had ~4–5 "tests" that were just structural grep checks.** Not a problem for this milestone's over-delivery, but the pattern of counting markdown-grep tests toward the milestone test total is a borderline case. A future convention refinement could separate `docs_structure_checks` from `runtime_tests` in the per-phase manifest.

## Notable Decisions

1. **Skipped T2c (Projection-based composition validator) + all Tier-3 items.** Scope discipline. The audit in Phase 726 M5 identified these as legitimate wins but their prerequisites (especially Phase 733 Intrinsic Telemetry production data) are not yet in place. Deferred cleanly rather than over-committing.

2. **Feature flags named `skill_isotropy_audit` / `sigreg` / `mission_world_model` / `intrinsic_telemetry` rather than LEJEPA-13..18.** Readability > traceability for config files that humans flip. Traceability lives in the REQUIREMENTS.md table.

3. **All four code-backed modules zero-dep (no torch, no numpy, no scipy).** The SIGReg primitive could have been a thin wrapper over the published PyTorch implementation. Instead it's a TypeScript-native port. Decision rationale: gsd-skill-creator's substrate is TypeScript; adding torch as a runtime dep for a ≤80-LOC loss function is the tail wagging the dog. If a future milestone needs actual gradient-flowing SIGReg inside a PyTorch training loop, that's a Silicon Layer integration (Tier-3 T3b, deferred).

4. **Mission-state world-model encoder is deterministic feature-hashing, not learned.** Decision rationale: this phase ships the *architecture* (encoder + predictor + CEM planner + CAPCOM preservation gate), not the *weights*. A future phase can swap the encoder for a learned one without changing the public API or the hard CAPCOM gate.

## Feed-Forward to Next Subversion (≤5 items)

1. **Documentation consolidation pass** — numerical_attribution.md should become the single source of truth; per-module tables in Modules 1–5 should point at it rather than duplicating.

2. **SIGReg 1024-slice smoke test** — add a production-scale integration test running the full LEJEPA_DEFAULT_CONFIG on synthetic data. Not blocking for v1.49.571 but worth having for the follow-on SIGReg-adapter work.

3. **Intrinsic Telemetry real data collection** — the Phase 733 correlation pipeline is tested on synthetic data. Start collecting per-mission signal data from v1.49.572 onward so the correlation numbers become empirical rather than theoretical.

4. **Mission-state world-model learned encoder** — swap the deterministic feature-hash encoder for a learned embedder once enough mission retrospectives have accumulated. Keep the hard CAPCOM preservation gate intact across the swap.

5. **Single-λ orchestration audit Tier-1 implementation** — Cluster B (suggest threshold collapse) is the lowest-risk starting set. Ship in a near-term milestone; defers Cluster A until Phase 733 telemetry has produced correlation evidence.

## Sources

- Balestriero, R. & LeCun, Y. (2025). *LeJEPA: Provable and Scalable Self-Supervised Learning Without the Heuristics.* arXiv:2511.08544v3 [cs.LG].
- LeCun, Y. (14 April 2026). *Special Lecture on AI and World Models.* Al-Khwarizmi Applied Mathematics Webinar.
- Maes, L., Le Lidec, Q., Scieur, D., LeCun, Y., & Balestriero, R. (2026). *LeWorldModel: Stable End-to-End Joint-Embedding Predictive Architecture from Pixels.*
- Reference implementations: `rbalestr-lab/lejepa` (MIT) · `lucas-maes/le-wm`
