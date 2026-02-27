# v1.47 Lessons Learned — Holomorphic Dynamics Educational Pack

## What Worked Well

### LLIS-47-01: Educational Content Velocity
- **Observation:** Educational module packs (content.md + try-session.ts) execute 3-4x faster per plan than code-heavy implementations
- **Impact:** 10 phases in ~40 min vs ~3h for comparable plan counts (v1.37, v1.38)
- **Recommendation:** For educational milestones, increase plan density per phase. Content plans are lightweight enough to support 3 plans/phase without exceeding context budgets

### LLIS-47-02: Research Paper Integration Pattern
- **Observation:** HD-06's references/ subdirectory pattern (meyerson.md, greene-lobb.md, mat327.md) enables granular citation without bloating module content
- **Impact:** HD-06 content.md stays at 84 lines while providing 3 deep-dive research references
- **Recommendation:** Adopt references/ pattern for all educational modules that cite academic papers

### LLIS-47-03: DMD Variant Delegation
- **Observation:** All 4 DMD variants (DMDc, mrDMD, piDMD, BOP-DMD) implemented as post-processing wrappers around base dmd() function
- **Impact:** ~400 lines of core code supports 5 different decomposition approaches with zero duplicated SVD/eigensolver logic
- **Recommendation:** When extending an algorithm family, implement the base case fully then wrap with variants — avoids divergent implementations

## What Could Be Improved

### LLIS-47-04: Agent Summary Format Enforcement
- **Observation:** Wave 0, 1, 2B, 3, 4B agents wrote aggregate summaries (429-SUMMARY.md) instead of per-plan summaries (429-01-SUMMARY.md, 429-02-SUMMARY.md, 429-03-SUMMARY.md)
- **Impact:** 6 of 10 phases needed manual summary splitting during milestone completion
- **Root Cause:** Executor prompt allows aggregate summaries; gsd-tools expects per-plan pattern
- **Recommendation:** Add explicit "one SUMMARY.md per PLAN.md" instruction to executor agent prompts

### LLIS-47-05: gsd-tools Milestone Complete Still Broken
- **Observation:** Fifth consecutive milestone where gsd-tools milestone complete counts all phases/plans (375/987) instead of only current milestone's (10/24) and pulls accomplishments from wrong phases
- **Impact:** Manual fixup of MILESTONES.md entry required every time (~5 min)
- **Recommendation:** Fix gsd-tools phase counting to use ROADMAP.md phase range, not total disk state

## Process Observations

### Mission Phase Assessment

| Phase | Quality | Notes |
|-------|---------|-------|
| Requirements | Good | 28 well-scoped requirements with clear categories |
| Planning | Good | VTM mission package consumed directly, zero research needed |
| Execution | Excellent | 10 phases, 6 waves, single session, 2 auto-fixes |
| Verification | Adequate | 209 tests, but no formal UAT due to educational content nature |
| Completion | Adequate | Manual summary fixup required; gsd-tools bugs still present |

## Recommendations Summary

1. **Increase plan density** for educational milestones (3 plans/phase)
2. **Enforce per-plan summary format** in executor agent prompts
3. **Fix gsd-tools milestone complete** phase counting (long-standing bug)
4. **Adopt references/ subdirectory** pattern for academic citation modules
5. **DMD variant delegation** pattern as standard for algorithm families
