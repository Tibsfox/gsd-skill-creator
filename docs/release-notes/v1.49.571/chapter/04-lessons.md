# Lessons — v1.49.571

14 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Two-half pattern is reusable.**
   v1.49.570 proved it; v1.49.571 inherits cleanly with only the additional convention that Half B can carry hard CAPCOM-preservation gates. Recommend formalizing the two-half + hard-gate convention for future milestone roadmappers.
   _⚙ Status: `investigate` · lesson #9995_

2. **Mission package as authoritative spec enables `skip_discuss`.**
   The 35-page three-stage package (Stage-1 Vision + Stage-2 Research Reference + Stage-3 Mission Spec) gave every phase a deterministic target. Pattern scales for survey-driven milestones; exploratory milestones should not skip discuss.
   _⚙ Status: `investigate` · lesson #9996_

3. **CAPCOM preservation as four-layer defense is the right shape.**
   Compile-time enum + runtime guard + const tag + public-export audit. Each layer catches its own class of attack. Removing any one opens a real hole. Promote into a shared substrate-author template.
   _⚙ Status: `investigate` · lesson #9997_

4. **<=80-LOC budget forces good delegation.**
   Phase 729 SIGReg port stayed small precisely because the budget forced delegation to `src/skill-isotropy/slicing.ts` primitives. The constraint produced reference to upstream `rbalestr-lab/lejepa` structural simplicity rather than re-creation.
   _⚙ Status: `investigate` · lesson #9998_

5. **Anderson-Darling tests need shape-carrying adversarial data.**
   A^2 standardizes inputs and cancels scale perturbations. Bimodal perturbation registers; simple scale perturbation does not. Lesson generalizes: any distribution-shape anomaly test must use shape-carrying adversarial data.
   _⚙ Status: `investigate` · lesson #9999_

6. **All six Half B code-backed modules zero-dep.**
   No torch, no numpy, no scipy. SIGReg as TypeScript-native port rather than thin wrapper over published PyTorch. Same rationale as later v1.49.572: substrate is TypeScript; adding heavyweight ML deps for a <=80-LOC loss function is the tail wagging the dog. If a future milestone needs gradient-flowing SIGReg inside a PyTorch training loop, that is Silicon Layer integration (Tier-3 T3b, deferred).
   _⚙ Status: `investigate` · lesson #10000_

7. **Mission-state world-model encoder is deterministic feature-hashing, not learned.**
   This phase ships the architecture (encoder + predictor + CEM planner + CAPCOM preservation gate), not the weights. A future phase can swap the encoder for a learned one without changing the public API or the hard CAPCOM gate. Decouple architecture-shipping from weight-shipping.
   _⚙ Status: `investigate` · lesson #10001_

8. **Feature flags named by function**
   (`skill_isotropy_audit` / `sigreg` / `mission_world_model` / `intrinsic_telemetry`) rather than by requirement code (LEJEPA-13..18). Readability > traceability for config files that humans flip. Traceability lives in the REQUIREMENTS.md table.
   _⚙ Status: `investigate` · lesson #10002_

9. **Documentation-only phases should not count markdown-grep "tests" toward the milestone test total.**
   Phases 730 + 731 over-delivered the milestone, so it did not matter, but the convention is borderline. Future refinement: separate `docs_structure_checks` from `runtime_tests` in the per-phase manifest.
   _⚙ Status: `investigate` · lesson #10003_

10. **Skipped T2c + all Tier-3 items as scope discipline.**
   The audit in Phase 726 M5 identified these as legitimate wins but their prerequisites (especially Phase 733 Intrinsic Telemetry production data) are not yet in place. Deferred cleanly rather than over-committing.
   _⚙ Status: `investigate` · lesson #10004_

11. **Anderson-Darling sensitivity in Phase 728 required test tuning.**
   The first version of the "collapse detection" test assumed a simple scale perturbation would register, but A^2 standardizes inputs and thus cancels scale. Had to switch to bimodal perturbation to get a standardization-invariant anomaly signal. Lesson: any test that scores distribution-shape anomalies must use shape-carrying adversarial data, not just scale.
   _⚙ Status: `investigate` · lesson #10005_

12. **Phase 724's empirical-findings table repeated numerical claims that Phase 722's module_1 already covered.**
   Some cross-module cross-references would have been cleaner with a single normative source (`numerical_attribution.md`) and pointers from the modules, rather than each module carrying its own copy of the figures. Phase 726 finalized the attribution table but the per-module tables stay as duplicates until a future documentation-consolidation pass.
   _⚙ Status: `investigate` · lesson #10006_

13. **SigregConfig's `numSlices` default is 1024 (per LeJEPA paper), but unit tests run at 8-64 slices.**
   The production default is right, but the tests run at 1-2 orders of magnitude less. Nothing wrong with that, but a production deployment would want to smoke-test the full 1024-slice configuration as part of the integration suite. Deferred to follow-on milestone.
   _⚙ Status: `investigate` · lesson #10007_

14. **The two documentation-only phases (730 Single-lambda audit, 731 Heuristics audit) had ~4-5 "tests" that were just structural grep checks.**
   Not a problem for this milestone's over-delivery, but the pattern of counting markdown-grep tests toward the milestone test total is a borderline case. A future convention refinement could separate `docs_structure_checks` from `runtime_tests` in the per-phase manifest.
   _⚙ Status: `investigate` · lesson #10008_
