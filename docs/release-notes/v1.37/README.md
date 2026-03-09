# v1.37 — Complex Plane Learning Framework

**Shipped:** 2026-02-26
**Phases:** 359-366 (8 phases) | **Plans:** 16 | **Commits:** 28 | **Requirements:** 50 | **Tests:** 446 | **LOC:** ~9.7K

Replaces skill-creator's implicit linear knowledge model with an explicit Complex Plane mathematical framework where every skill occupies a position defined by angle theta (abstract-to-concrete balance) and radius r (maturity), with tangent-line activation, bounded angular rotation promotion, Euler skill composition, and versine/exsecant health metrics.

### Key Features

**Mathematical Core (Phase 359):**
- 7 Zod schemas (SkillPosition, TangentContext, TangentMatch, ChordCandidate, PromotionDecision, AngularObservation, PlaneMetrics)
- PromotionLevel enum, PROMOTION_REGIONS
- 19 pure arithmetic functions with division-by-zero guards
- 129 tests

**Tangent Activation Engine (Phase 360):**
- TaskVector analysis classifying concrete/abstract context signals
- Enhanced scoring with configurable geometric/semantic weight blending (60/40 default)
- Surgical Score stage integration preserving all 5 downstream pipeline stages
- 37 tests

**Observer Angular Integration (Phase 361):**
- PositionStore with JSON persistence at .claude/plane/positions.json
- SIGNAL_WEIGHTS classification (12 signal types)
- ObserverAngularBridge with session processing and angular velocity clamping
- 54 tests

**Angular Promotion Pipeline (Phase 362):**
- 7-check AngularPromotionEvaluator (direction, adjacency, angular step, evidence, stability, velocity, existing F1/MCC)
- AngularRefinementWrapper with content direction analysis
- CONSTRAINT_MAP preserving 3-correction/7-day/20% rules
- 52 tests

**Chord Detection & Euler Composition (Phase 363):**
- ChordDetector with configurable arc/savings/frequency filtering
- ChordStore persistence
- EulerCompositionEngine (complex multiplication, quality assessment, action recommendation)
- Co-activation geometric gate
- 54 tests

**Plane Metrics Dashboard (Phase 364):**
- Versine distribution (grounded/working/frontier)
- Exsecant reach, velocity warnings
- `skill-creator plane-status` CLI with --json/--snapshot/--detail
- Terminal bar charts
- 33 tests

**Migration System (Phase 365):**
- SkillMigrationAnalyzer (trigger/content/history analysis)
- PlaneMigration executor (dry-run/force/idempotent)
- `skill-creator migrate-plane` CLI with 4 flags
- 68 tests

**Integration & Verification (Phase 366):**
- 12 safety-critical tests (SC-01 through SC-12)
- 12 E2E integration tests (INT-01 through INT-12)
- Full regression (16,100 tests, 0 failures)
- Barrel exports for 13 modules
- 38 tests

## Retrospective

### What Worked
- **Replacing implicit linear knowledge with explicit Complex Plane positioning.** Every skill now occupies a position defined by theta (abstract-to-concrete) and r (maturity). This is not a metaphor bolted on -- it's a mathematical framework that drives tangent activation, chord detection, and Euler composition.
- **446 tests across 8 phases with 12 safety-critical and 12 E2E integration tests.** The test distribution is well-balanced: 129 for math core, 37 for tangent activation, 54 for observer, 52 for promotion, 54 for chord/Euler, 33 for metrics, 68 for migration, 38 for integration. No phase is under-tested.
- **Migration system with dry-run/force/idempotent modes.** SkillMigrationAnalyzer + PlaneMigration executor means existing skills can move to the Complex Plane framework without manual intervention. The dry-run mode makes migration safe to preview.
- **Full regression clean at 16,100 tests.** Adding 446 new tests while maintaining zero failures across the entire test suite demonstrates that the Complex Plane framework integrates without breaking existing systems.

### What Could Be Better
- **60/40 geometric/semantic weight blending is a magic number.** The configurable weight blending between geometric and semantic scoring in tangent activation defaults to 60/40 without documented justification for why this ratio was chosen. Calibration data would strengthen the default.
- **Angular velocity clamping parameters (3-correction/7-day/20% rules) are carried forward as constraints.** These bounded learning rules from the CONSTRAINT_MAP are preserved but not empirically validated in the Complex Plane context. They may need recalibration.

## Lessons Learned

1. **Mathematical frameworks need migration paths, not just greenfield design.** The SkillMigrationAnalyzer that inspects existing skills for trigger/content/history compatibility is what makes the Complex Plane adoption practical. Without it, 451 existing primitives would need manual repositioning.
2. **Versine/exsecant metrics provide geometric health indicators that linear metrics cannot.** Versine distribution (grounded/working/frontier) and exsecant reach measure skill health in terms of angular position, not just counts. The choice of trigonometric functions is deliberate -- they measure curvature, not distance.
3. **Chord detection between co-activated skills surfaces composition opportunities automatically.** Rather than manually defining which skills compose well, the ChordDetector finds natural pairings from usage patterns. Euler composition (complex multiplication) then provides the mathematical operation for combining them.
4. **12 safety-critical tests (SC-01 through SC-12) as a named, numbered set makes safety auditable.** Named tests can be referenced in compliance discussions. Unnamed tests disappear into aggregate counts.

---
