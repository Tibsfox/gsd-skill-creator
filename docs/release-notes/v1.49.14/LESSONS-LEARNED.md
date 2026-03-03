# v1.49.14 Lessons Learned — Dependency Health Monitor & Progressive Internalization Engine

## LLIS Format Entries

### LL-4914-01: Supply Chain Security as Pipeline Architecture
**Category:** What Worked Well
**Observation:** The six-module pipeline (audit->diagnose->discover->resolve->absorb->integrate) decomposed supply chain security into independently testable and deployable units. Each module has a single responsibility, clear input/output contracts, and can be upgraded without affecting the others.
**Recommendation:** Model supply chain security as a pipeline, not a monolith. Each concern (scanning, classification, discovery, resolution, absorption, integration) has different change frequencies and failure modes. Pipeline architecture respects these differences.

### LL-4914-02: One Dependency Per Resolution
**Category:** What Worked Well
**Observation:** Constraining the resolver to change exactly one dependency per invocation made every change traceable and every failure attributable. When a resolution caused issues, the blast radius was exactly one dependency — bisection was instantaneous.
**Recommendation:** For any system that modifies dependency manifests, enforce one-change-per-invocation. The throughput cost is minimal; the debuggability improvement is significant.

### LL-4914-03: Oracle Testing for Behavioral Equivalence
**Category:** What Worked Well
**Observation:** Oracle testing (10K+ generated cases comparing original dependency output with internalized code output) caught behavioral differences that handwritten unit tests missed. Specifically, edge cases in floating-point handling and Unicode normalization that only appear with diverse generated inputs.
**Recommendation:** Before absorbing any external code, run oracle tests with property-based or fuzz-generated inputs. The coverage of edge cases far exceeds what manual test authoring achieves.

### LL-4914-04: Hard Block Categories Are Non-Negotiable
**Category:** What Worked Well
**Observation:** The hard block on absorbing crypto, parsers, protocols, and compression code prevented the system from even attempting to internalize security-sensitive categories. This is a design-time decision, not a runtime check — the code absorber never sees these packages.
**Recommendation:** Maintain a block list of categories that must never be internalized, regardless of how small or pure they appear. Security-sensitive code requires dedicated maintenance by domain experts, which automated absorption cannot provide.

### LL-4914-05: Cross-Project Pattern Learning Value
**Category:** What Worked Well
**Observation:** The PatternLearner's cross-project warning system (alert after 5+ projects flag the same dependency) is the highest-value feature in the pipeline. Individual project scanning is necessary but reactive; cross-project learning is proactive.
**Recommendation:** For any monitoring system that operates across multiple projects, aggregate findings and generate pre-emptive warnings. The pattern threshold (5+ projects) balances noise reduction with early detection.

### LL-4914-06: Criteria Gate Conservatism
**Category:** What Could Be Improved
**Observation:** The criteria gate (<=500 LOC, stable API, pure functions, <=20% API surface) was intentionally conservative. Some packages that met all criteria in spirit were excluded because they slightly exceeded a threshold (e.g., 520 LOC). Manual override was not provided by design.
**Recommendation:** Keep criteria gate thresholds conservative but document the excluded-by-margin cases. Over time, the margin cases inform threshold refinement. Never add a manual override — the gate's value comes from its non-negotiability.

### LL-4914-07: Gradual Call-Site Replacement
**Category:** What Could Be Improved
**Observation:** The <=20% per-cycle call-site replacement limit worked but made full absorption a multi-cycle process. For packages used in many call sites, 5+ cycles were needed. Each cycle required re-running oracle tests and human approval.
**Recommendation:** The multi-cycle cost is correct and intentional — it prevents big-bang replacement failures. However, consider allowing batch cycles for packages with fewer than 10 call sites where the blast radius is inherently small.

## Recommendations Summary

| # | Recommendation | Priority |
|---|---------------|----------|
| 1 | Model supply chain security as a pipeline, not a monolith | High |
| 2 | Enforce one-dependency-per-resolution for traceability | High |
| 3 | Run oracle/fuzz tests before any code absorption | High |
| 4 | Maintain non-negotiable block list for security-sensitive categories | Critical |
| 5 | Aggregate cross-project monitoring findings for pre-emptive warnings | High |
| 6 | Keep criteria gate thresholds conservative, track margin cases | Medium |
| 7 | Consider batch replacement cycles for small call-site counts | Low |
