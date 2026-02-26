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

---
