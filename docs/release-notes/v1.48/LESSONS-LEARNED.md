# v1.48 Lessons Learned — Physical Infrastructure Engineering Pack

## What Worked Well

### LLIS-48-01: Wave-Based Parallel Execution for Multi-Domain Packs
- **Observation:** 12 phases across 7 waves with parallel A/B tracks in waves 1-5 kept wall-clock time to ~4.5 hours despite 30 plans
- **Impact:** Domain-independent phases (fluid vs power, blueprint P&ID vs SLD) executed in parallel without interface conflicts
- **Recommendation:** For multi-domain skill packs, always identify independent domains early and assign to parallel wave tracks

### LLIS-48-02: VTM-to-GSD Pipeline Maturity
- **Observation:** Seventh consecutive milestone consuming a pre-built VTM mission package directly, skipping research phase entirely
- **Impact:** ~30 min saved per milestone; requirements arrive pre-validated and categorized
- **Recommendation:** VTM pipeline is now proven production-grade. Continue using for all future milestones

### LLIS-48-03: Parametric Symbol Helpers
- **Observation:** 80 SVG symbols (50 ISA-5.1 + 30 IEEE C2) implemented via parametric generator functions rather than hand-drawn SVG paths
- **Impact:** ~400 lines of helper code produces 80 symbols with consistent styling, connection points, and annotation placement
- **Recommendation:** Always use parametric generation for symbol libraries. Hand-drawn SVG does not scale and creates inconsistency

### LLIS-48-04: Safety-First Architecture
- **Observation:** Implementing Safety Warden in Wave 0 (before any domain skills) meant every subsequent phase built on top of safety constraints
- **Impact:** Zero rework from safety violations across all 29 remaining plans; PE disclaimer present on every output from day one
- **Recommendation:** For any engineering domain pack, implement safety crosscut in the foundation phase — never retrofit safety after domain logic exists

### LLIS-48-05: Progressive Disclosure SKILL.md Format
- **Observation:** Main SKILL.md fits in ~200 tokens (practical overview), with 8 reference documents providing full engineering depth
- **Impact:** Token budget stays within 2-5% allocation; users get immediate value without loading 21K LOC of engineering reference
- **Recommendation:** All skill packs with >5K LOC should use progressive disclosure with references/ subdirectory

## What Could Be Improved

### LLIS-48-06: gsd-tools Milestone Complete Bugs (Sixth Consecutive)
- **Observation:** gsd-tools milestone complete still counts all phases/plans on disk (445/1061) instead of current milestone (12/30), and pulls accomplishments from prior milestones
- **Impact:** Manual fixup of MILESTONES.md required every time (~5 min), now a known tax
- **Root Cause:** Phase counting uses glob over .planning/phases/ instead of reading ROADMAP.md phase range
- **Recommendation:** Fix gsd-tools to read ROADMAP.md for phase range bounds — this is now a 6-milestone-old known bug

### LLIS-48-07: Context Compaction for Large Milestones
- **Observation:** 80-requirement milestones exhaust context budget after ~25-30 requirements, requiring session boundaries
- **Impact:** 3 sessions needed instead of the typical 1-2 for smaller milestones
- **Root Cause:** SVG symbol generation in blueprint phases is particularly context-heavy
- **Recommendation:** For milestones with >60 requirements, pre-plan session boundaries at wave transitions

### LLIS-48-08: Requirement ID Coverage in SUMMARY Frontmatter
- **Observation:** 12 of 30 plans had incomplete or missing requirement IDs in their SUMMARY.md frontmatter
- **Impact:** Requirement traceability degraded; manual cross-referencing needed during verification
- **Root Cause:** Executor agents prioritize code correctness over metadata completeness
- **Recommendation:** Add explicit "list all addressed REQ-IDs" instruction to plan templates

## Process Observations

- Simulation bridge generating inputs only (not running simulations) is the correct scope boundary: licensed software and validated models are out of scope for a skill pack
- Safety architecture must be structural (non-bypassable) not configurable (toggle-able): a safety flag that can be turned off is not safety
- Router topology with Architect (Opus) entry point works well for multi-domain packs: users describe intent in natural language, the router dispatches to the correct specialist
- Educational bridge to Minecraft/Factorio provides an intuitive on-ramp: students grasp fluid dynamics through Factorio pipe mechanics before encountering Darcy-Weisbach

### Mission Phase Assessment

| Phase | Quality | Notes |
|-------|---------|-------|
| Requirements | Excellent | 80 well-categorized requirements across 12 domains |
| Planning | Excellent | VTM package consumed directly, zero research needed |
| Execution | Good | 12 phases, 7 waves, 3 sessions, 52 commits |
| Verification | Good | 401 tests, 3 E2E pipeline tests, safety warden validation |
| Completion | Adequate | gsd-tools bugs required manual fixup; some REQ-ID gaps |

## Recommendations Summary

| # | Recommendation | Priority | Source |
|---|---------------|----------|--------|
| 1 | Fix gsd-tools milestone complete phase counting | High | LLIS-48-06 |
| 2 | Pre-plan session boundaries for >60 requirement milestones | Medium | LLIS-48-07 |
| 3 | Enforce REQ-ID listing in SUMMARY frontmatter | Medium | LLIS-48-08 |
| 4 | Use parametric generation for all symbol libraries | Low | LLIS-48-03 |
| 5 | Implement safety crosscut in Wave 0 for engineering packs | Low | LLIS-48-04 |
| 6 | Adopt progressive disclosure for all packs >5K LOC | Low | LLIS-48-05 |
