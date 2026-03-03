# v1.49.12 Lessons Learned — Heritage Skills Educational Pack

## LLIS Format Entries

### LL-4912-01: Cultural Sovereignty as First-Class Architecture
**Category:** What Worked Well
**Observation:** Implementing cultural sovereignty as a 4-level classification system (open/restricted/ceremonial/sacred) with Level 4 as a hard block with zero override paths prevented every adversarial bypass attempt across 36 red-team scenarios. The architecture-level enforcement is fundamentally more robust than policy-level guidance.
**Recommendation:** For any system handling culturally sensitive content, implement sovereignty as architecture (code-enforced levels with hard blocks) rather than policy (guidelines that can be bypassed). The cost of false negatives (leaked sacred content) far exceeds the cost of false positives (over-restricted access).

### LL-4912-02: Mission Pack as Research
**Category:** What Worked Well
**Observation:** The Heritage Skills mission pack documents provided complete research, specifications, and wave plans. All 45 plans executed directly from mission pack specs without requiring additional research phases. This is the pattern established in v1.49.8 scaled to a much larger milestone.
**Recommendation:** Continue investing in high-quality mission packs. For milestones with 40+ plans, the upfront research investment in the mission pack saves proportionally more execution-phase research than smaller milestones.

### LL-4912-03: Two-Phase Rollout for Scope Control
**Category:** What Worked Well
**Observation:** Phase 1 (Foxfire & Northern Ways, Phases 28-34) and Phase 2 (PNW Coast & Trail Badges, Phases 35-39) provided natural thematic boundaries. Phase 1 established all infrastructure (types, wardens, Skill Hall framework) that Phase 2 consumed without modification.
**Recommendation:** For large educational packs, split into foundation phase (infrastructure + first tradition set) and extension phase (additional traditions + cross-cutting features). This catches infrastructure issues early before scaling to more content.

### LL-4912-04: Red-Team Testing for Cultural Content
**Category:** What Worked Well
**Observation:** 36 adversarial scenarios (18 per phase) tested specific bypass vectors: academic exceptions, emotional manipulation, knowledge-holder impersonation, ceremony extraction disguised as cultural appreciation, and reconnecting descendant exploitation. All were correctly rejected.
**Recommendation:** Red-team cultural content systems with the same rigor as security systems. The bypass vectors are different (social engineering rather than injection) but the consequences of leakage are equally serious.

### LL-4912-05: Nation-Specific Attribution Enforcement
**Category:** What Worked Well
**Observation:** The TeachItEvaluator includes pan-Indigenous language detection that catches generalizations like "Native American tradition" or "Indigenous practice" and requires specific nation attribution. Zero pan-Indigenous generalizations passed through either audit.
**Recommendation:** Automated pan-Indigenous detection should be mandatory for any system referencing Indigenous knowledge. Manual review misses subtle generalizations; automated detection catches them consistently.

### LL-4912-06: Badge Retrofit Cost
**Category:** What Could Be Improved
**Observation:** Phase 1 rooms (1-14) shipped without Explorer+Apprentice badge coverage. Phase 38 had to retrofit 12 badges across 14 rooms. The retrofit was straightforward but could have been avoided by including badge definitions in the initial room phases.
**Recommendation:** When planning a progressive mastery system, include at least Explorer-tier badges in the initial room/module phase. Retrofitting badges is cheap but represents avoidable rework.

### LL-4912-07: Room Count Scaling Overhead
**Category:** What Could Be Improved
**Observation:** 18 rooms with unique content each required significant per-room effort. Structural boilerplate (safety integration, cultural sovereignty checks, SUMO hierarchy, session runner hooks) was similar across all rooms but authored individually.
**Recommendation:** Build a room scaffolding tool that generates the structural boilerplate (safety domain declarations, sovereignty level mappings, session runner integration) and leaves content-specific sections for manual authoring. Similar to the panel template recommendation from v1.49.8.

## Recommendations Summary

| # | Recommendation | Priority |
|---|---------------|----------|
| 1 | Implement cultural sovereignty as architecture, not policy | Critical |
| 2 | Mandate automated pan-Indigenous detection for all Indigenous content systems | High |
| 3 | Red-team cultural content with same rigor as security systems | High |
| 4 | Split large educational packs into foundation + extension phases | High |
| 5 | Include Explorer-tier badges in initial room phases (avoid retrofit) | Medium |
| 6 | Build room scaffolding tool for structural boilerplate | Medium |
| 7 | Continue investing in mission pack quality for large milestones | Medium |
