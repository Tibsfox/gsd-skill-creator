# v1.49.8 Lessons Learned — Cooking With Claude

## LLIS Format Entries

### LL-498-01: Foxfooding Validates Architecture
**Category:** What Worked Well
**Observation:** The system successfully described itself using its own three pillars — GSD workflow mapped to Rosetta Core, development mapped to Calibration, project organization mapped to College Structure. This self-description exercise revealed no abstraction mismatches.
**Recommendation:** When building an architecture that claims generality, require it to describe its own development process. If the abstractions can't self-apply, they aren't general enough.

### LL-498-02: Teaching Reference as Research Phase
**Category:** What Worked Well
**Observation:** The cooking fundamentals research document contained sufficient domain knowledge to serve as both research output and planning input. Skipping a separate research phase saved ~2 hours without any quality loss in the delivered content.
**Recommendation:** When a high-quality domain reference document exists, pipe it directly into planning. Reserve separate research phases for domains where no authoritative reference is available.

### LL-498-03: Progressive Disclosure Token Budget
**Category:** What Worked Well
**Observation:** The 3-tier progressive disclosure model (summary <3K, active <12K, deep 50K+) kept panel loading within the 2-5% context window ceiling throughout all 9 language panels and both departments.
**Recommendation:** Design token budgets as tier thresholds, not per-content limits. The tier model scales to arbitrary content because each tier has a fixed ceiling regardless of how much deep content exists.

### LL-498-04: Absolute Safety Boundaries
**Category:** What Worked Well
**Observation:** Making food safety temperatures non-overridable by the Calibration Engine prevented a class of bugs where well-intentioned calibration adjustments could have lowered safety thresholds. All 14 safety-critical tests passed with zero tolerance.
**Recommendation:** For any domain with safety-critical thresholds, implement them as absolute boundaries outside the calibration system. The calibration engine should never see safety parameters as tunable values.

### LL-498-05: Wave Parallelism Scaling
**Category:** What Worked Well
**Observation:** 5 execution waves with up to 3 parallel tracks completed 45 plans in ~2 hours wall time. Plans within each wave were genuinely independent, so no coordination overhead was incurred.
**Recommendation:** Invest time in wave planning to ensure intra-wave independence. The parallelism payoff is significant (3x throughput) but only works when plans truly don't depend on each other.

### LL-498-06: Panel Boilerplate
**Category:** What Could Be Improved
**Observation:** 9 language panels share significant structural similarity (metadata, concept lists, translation functions, test scaffolding). Each panel was written from scratch, duplicating ~60% of the structure across all 9.
**Recommendation:** Build a panel template generator for future Rosetta Core panels. The template should handle metadata, concept scaffolding, translation stubs, and test generation — leaving only the language-specific content to be authored manually.

### LL-498-07: Calibration Threshold Discovery
**Category:** What Could Be Improved
**Observation:** The 20% bounded adjustment cap and the 3-tier token thresholds were both arrived at through trial and error during development. Initial values were either too permissive (calibration overshoot) or too restrictive (insufficient adaptation).
**Recommendation:** Document initial threshold values and their observed effects as calibration evolves. This creates a tuning history that informs future parameter selection — especially for new departments that may have different sensitivity characteristics.

## Recommendations Summary

| # | Recommendation | Priority |
|---|---------------|----------|
| 1 | Require architectures to self-describe (foxfood test) | High |
| 2 | Use domain reference docs as research when high-quality sources exist | High |
| 3 | Design token budgets as tier thresholds, not per-content limits | High |
| 4 | Implement safety boundaries outside calibration system | High |
| 5 | Invest in wave planning for genuine intra-wave independence | Medium |
| 6 | Build panel template generator for Rosetta Core | Medium |
| 7 | Maintain calibration tuning history for threshold selection | Low |
