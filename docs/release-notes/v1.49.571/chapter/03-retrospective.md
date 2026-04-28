# Retrospective — v1.49.571

## What Worked

1. **Two-half pattern copy from v1.49.570.** Mirroring the Convergent Substrate shape (Half A research + corpus tie-in; Half B default-off modules opted-in via `.claude/gsd-skill-creator.json`) gave the roadmapper a known-good skeleton and let the autonomous execution reuse the established Safety Warden BLOCK → CAPCOM preservation → flag-off regression chain end-to-end.

2. **Mission package as authoritative spec.** The 35-page Stage-1 Vision + Stage-2 Research Reference + Stage-3 Mission Spec gave every phase a deterministic target. `skip_discuss` was safe because there were no real grey areas — the mission package already resolved them. This pattern scales cleanly for survey-driven milestones but would fail for exploratory ones.

3. **CAPCOM preservation as a *hard* gate for Half B.** The compile-time `MissionAction` enum + runtime `assertNoGateBypassAction` guard + `AdvisoryPlan.advisoryOnly: true` const tag + public-export forbidden-name audit is a four-layer defense. Every layer caught its own class of attack; removing any one would have opened a real hole.

4. **≤80-LOC budget as a design forcing function.** Phase 729's SIGReg port core came in under budget precisely because the budget forced delegation to the `src/skill-isotropy/slicing.ts` primitives from Phase 728. This made the port reference `rbalestr-lab/lejepa`'s structural simplicity rather than re-creating it.

5. **Spearman correlation as a reusable primitive.** Phase 733's `rankWithTies + spearman + pearson` implementation was ~60 LOC but serves as a reusable correlation primitive. The `bestSignal` selection + verdict classification is a cheap but useful analysis layer on top.

## What Could Be Better

- **Anderson-Darling sensitivity in Phase 728 required test tuning.** The first version of the "collapse detection" test assumed a simple scale perturbation would register, but A^2 standardizes inputs and thus cancels scale. Had to switch to bimodal perturbation to get a standardization-invariant anomaly signal. Lesson: any test that scores distribution-shape anomalies must use shape-carrying adversarial data, not just scale.

- **Phase 724's empirical-findings table repeated numerical claims that Phase 722's module_1 already covered.** Some cross-module cross-references would have been cleaner with a single normative source (`numerical_attribution.md`) and pointers from the modules, rather than each module carrying its own copy of the figures. Phase 726 finalized the attribution table but the per-module tables stay as duplicates until a future documentation-consolidation pass.

- **SigregConfig's `numSlices` default is 1024 (per LeJEPA paper), but unit tests run at 8-64 slices.** The production default is right, but the tests run at 1-2 orders of magnitude less. Nothing wrong with that, but a production deployment would want to smoke-test the full 1024-slice configuration as part of the integration suite. Deferred to follow-on milestone.

- **The two documentation-only phases (730 Single-lambda audit, 731 Heuristics audit) had ~4-5 "tests" that were just structural grep checks.** Not a problem for this milestone's over-delivery, but the pattern of counting markdown-grep tests toward the milestone test total is a borderline case. A future convention refinement could separate `docs_structure_checks` from `runtime_tests` in the per-phase manifest.

## Lessons Learned

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
