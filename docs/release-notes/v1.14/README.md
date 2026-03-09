# v1.14 — Promotion Pipeline

**Shipped:** 2026-02-13
**Phases:** 115-122 (8 phases) | **Plans:** 16 | **Requirements:** 27

Connect 5 isolated subsystems (Blitter, Pipeline Learning, Observation, Calibration, Pattern Detection) into an integrated promotion pipeline — from execution capture through deterministic analysis to automatic script promotion with metrics-driven gatekeeping.

### Key Features

**Execution Capture (Phase 115):**
- Pipeline pairing tool_use/tool_result events
- SHA-256 content hashes for cross-session comparison
- Structured capture format with timestamps and metadata

**Determinism Analyzer (Phase 116):**
- Three-tier classification: deterministic, semi-deterministic, non-deterministic
- Configurable variance thresholds per tool type
- Cross-session comparison for stability assessment

**Promotion Detector (Phase 117):**
- Weighted composite scoring: determinism (40%), frequency (35%), token savings (25%)
- Promotion candidate ranking with evidence trails

**Script Generator (Phase 118):**
- Tool-to-bash mapping for deterministic operations
- Dry-run validation before script creation
- Blitter OffloadOperation conformance for execution integration

**Promotion Gatekeeper (Phase 119):**
- F1/accuracy/MCC calibration metrics as gate criteria
- Auditable decision trail for all promote/reject decisions

**Drift Monitor & Feedback Bridge (Phase 120):**
- Post-promotion variance monitoring
- Automatic demotion when script behavior diverges from expected
- Feedback bridge connecting user corrections to promotion decisions

**Lineage Tracker (Phase 121):**
- Bidirectional provenance querying
- Full lineage from observation → pattern → promotion → script
- Cross-stage relationship mapping

**Dashboard Collectors (Phase 122):**
- Pipeline status collector showing promotion pipeline state
- Determinism scores visualization
- Lineage views for exploring promotion chains

## Retrospective

### What Worked
- **Connecting 5 isolated subsystems into a single pipeline is genuine integration work.** Blitter, Pipeline Learning, Observation, Calibration, and Pattern Detection existed independently -- this release wires them into a promotion flow with data flowing from capture through analysis to promotion.
- **Weighted composite scoring (determinism 40%, frequency 35%, token savings 25%) makes promotion decisions transparent.** Each factor has a weight, each promotion has a score, each score has evidence. No opaque ML -- just weighted criteria.
- **Automatic demotion via the drift monitor prevents promoted scripts from going stale.** Promotion is not a permanent decision. If a script's behavior diverges from expected, it gets demoted. This is the safety net for the entire promotion pipeline.
- **Full lineage tracking (observation -> pattern -> promotion -> script) with bidirectional querying makes the pipeline auditable.** You can trace any promoted script back to the observations that justified it, or any observation forward to the scripts it influenced.

### What Could Be Better
- **The promotion pipeline has 8 phases for what is fundamentally a linear flow.** Capture -> Analyze -> Score -> Generate -> Gate -> Monitor -> Track -> Display. Each step is simple; the complexity is in wiring them together correctly.
- **F1/accuracy/MCC calibration metrics as gate criteria overlap with v1.2's test infrastructure metrics.** The evaluator-optimizer from v1.9 also uses these metrics. Three systems now compute overlapping quality metrics for different purposes.

## Lessons Learned

1. **Three-tier determinism classification (deterministic, semi-deterministic, non-deterministic) is the right granularity.** Binary would miss semi-deterministic operations (e.g., commands that produce different output but same side effects). More tiers would be noise.
2. **Dry-run validation before script creation prevents generating broken scripts.** The cost of a failed dry run is negligible; the cost of promoting a broken script is a regression that erodes trust in the automation.
3. **Dashboard collectors for pipeline status bring promotion visibility into the existing dashboard.** Rather than building a new UI, the promotion pipeline feeds into the v1.12/v1.12.1 dashboard infrastructure. This is integration over invention.

---
