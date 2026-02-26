# v1.37 Retrospective — Complex Plane Learning Framework

**Shipped:** 2026-02-26
**Phases:** 8 (359-366) | **Plans:** 16 | **Commits:** 28 | **Sessions:** 1
**Tests:** 446 | **Source LOC:** ~9.7K | **Requirements:** 50/50

### What Was Built
- Complex plane mathematical framework: 7 Zod schemas (SkillPosition, TangentContext, TangentMatch, ChordCandidate, PromotionDecision, AngularObservation, PlaneMetrics), PromotionLevel enum with PROMOTION_REGIONS, 19 pure arithmetic functions with EPSILON division-by-zero guards, normalizeAngle wrapping, Euler composition via complex multiplication
- Tangent activation engine: TaskVector analysis classifying 12 signal types (file paths, phase refs, code blocks, semantic phrases), configurable geometric/semantic weight blending (60/40 default), surgical Score stage integration preserving all 5 downstream pipeline stages
- Observer angular integration: PositionStore (JSON persistence at .claude/plane/positions.json, Zod validation, CRUD), ObserverAngularBridge with session processing and angular velocity clamping, assignInitialPosition as pure function
- Angular promotion pipeline: 7-check AngularPromotionEvaluator (direction, adjacency, angular step, evidence, stability, velocity, existing framework), AngularRefinementWrapper with ratio-based content direction analysis, CONSTRAINT_MAP preserving 3-correction/7-day/20% rules
- Chord detection and Euler composition: ChordDetector with configurable arc/savings/frequency thresholds, ChordStore persistence, EulerCompositionEngine with quality assessment (excellent/good/marginal/poor), action recommendation, co-activation geometric gate
- Plane metrics dashboard: versine distribution (grounded/working/frontier), exsecant reach, velocity warnings, `skill-creator plane-status` CLI with --json/--snapshot/--detail flags, terminal bar charts
- Migration system: SkillMigrationAnalyzer (trigger/content/history analysis with 5 content helpers), PlaneMigration executor (dry-run/force/idempotent), `skill-creator migrate-plane` CLI
- Integration verification: 12 safety-critical tests (SC-01..SC-12), 12 E2E integration tests (INT-01..INT-12), full regression (16,100 tests, 0 failures), barrel exports for 13 modules

### What Worked
- **5-wave execution with max 2 parallel tracks**: 16 plans completed in single session; clean wave dependency management
- **Pre-built VTM mission package (12 docs)**: Zero research phase — consumed directly by new-milestone, immediate wave planning
- **Wave 0 type-first pattern proven again**: Foundation types (Phase 359) before any parallel work prevented interface mismatch across all 4 subsequent waves
- **PositionStorePort interface pattern**: Decoupled ChordDetector, PromotionEvaluator, and MigrationAnalyzer from concrete PositionStore — maximum parallel track independence
- **6 auto-fixed deviations, zero manual intervention**: ChordStore.getAll() vs plan's getActive(), velocity clamping adjustment, test threshold tuning, barrel export collision — all caught and resolved by executor agents
- **Full regression green (16,100 tests)**: Zero backward compatibility regressions despite deep Score stage integration
- **Single-session milestone**: Entire v1.37 (plan + execute + verify) in one context window

### What Was Inefficient
- **ROADMAP.md phase status tracking stale**: Several phases show "1/2" instead of "2/2" plans complete — executor agents updated SUMMARY.md but not always ROADMAP.md plan counts
- **Retrospective not written before session end in v1.36**: Same lesson again — must write retrospective as final pre-archival step
- **gsd-tools milestone complete bugs still persist**: Manual fixup still required (4th consecutive milestone)

### Patterns Established
- **PositionStorePort as universal decoupling interface**: Every module that reads positions uses the port, not the concrete store — enables testing and parallel development
- **Duck-typed store readers**: PositionStoreReader/ChordStoreReader with minimal surface area for metrics testability
- **Ratio-based content direction analysis**: Abstract/concrete classification via indicator counting with weighted code blocks (3x) and semantic phrases (2x)
- **Alias-based barrel collision resolution**: When multiple modules define same interface name, use `as` alias in barrel re-exports
- **Weighted signal classification table**: 12 signal types with numeric weights for deterministic concrete/abstract scoring

### Key Lessons
1. **Wave 0 types + PositionStorePort = maximum parallelism**: Same lesson as v1.35 (DependencyGraphPort) and v1.36 (CitationStorePort) — port interfaces are the multiplier
2. **Geometric/semantic blend with configurable weight is the right default**: 60/40 geometric/semantic lets the plane enhance scoring without breaking semantic-only fallback
3. **Duck-typed readers beat full interface exposure for metrics**: Metrics modules only need getAll/getPositions — minimal surface reduces coupling
4. **Content analysis weights need empirical tuning**: Code blocks 3x, commands 2x, semantic 2x — these ratios came from executor deviation fixes, not upfront design
5. **Single-session execution confirmed for 16-plan milestones**: v1.36 (16 plans) and v1.37 (16 plans) both completed in single sessions — the boundary is consistent

### Cost Observations
- Model mix: ~25% Opus (activation engine, promotion, chord/composition, integration), ~70% Sonnet (types, observer, dashboard, migration), ~5% Haiku (barrel/scaffolding)
- Sessions: 1 (entire milestone in single context window)
- Notable: 8 phases in ~50 min active = ~6.25 min/phase average; consistent with v1.36 velocity

---
