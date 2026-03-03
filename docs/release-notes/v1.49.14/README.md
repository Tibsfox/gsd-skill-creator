# v1.49.14 — Dependency Health Monitor & Progressive Internalization Engine

**Shipped:** 2026-03-03
**Phases:** 6 (44-49) | **Plans:** 26 | **Commits:** 21
**Files:** 86 new source files | **New Code:** 10,680 LOC TypeScript in `src/`
**Tests:** 353 new (23,330 total passing) | **Requirements:** 30/30

## Summary

A complete supply chain immune system spanning six modules: dependency auditor, health diagnostician, alternative discoverer, dependency resolver, code absorber, and integration layer. Covers 5 package ecosystems (npm, PyPI, conda, crates.io, RubyGems) with OSV.dev vulnerability scanning, evidence-backed alternative discovery, HITL-gated resolution with instant rollback, oracle-verified code absorption, and append-only health logging with cross-project pattern learning.

## Key Features

### Phase 44: Dependency Auditor
- Multi-ecosystem manifest parsing: package.json, requirements.txt/pyproject.toml, environment.yml, Cargo.toml, Gemfile
- OSV.dev vulnerability scanning with severity mapping
- Shared rate-limiter: <=30 requests/60s aggregate across all registry adapters
- Incremental scanning — only re-audit changed dependencies

### Phase 45: Health Diagnostician
- 6-class health classification: healthy, aging, stale, abandoned, deprecated, vulnerable
- Ecosystem-aware thresholds (npm vs PyPI vs crates.io have different "stale" definitions)
- Python compatibility matrix evaluation
- Conflict detection across dependency trees
- P0-P3 severity ranking for prioritized remediation

### Phase 46: Alternative Discoverer
- SuccessorDetector: finds official successor packages via registry metadata
- ForkFinder: identifies active community forks of abandoned packages
- EquivalentSearcher: discovers functionally equivalent alternatives
- InternalizationFlagger: marks candidates for code absorption based on size/stability/purity criteria
- Each result carries structured evidence with confidence scores and relationship types

### Phase 47: Dependency Resolver
- Backup before every manifest change (automatic restore on failure)
- Dry-run verification before applying changes
- Human-in-the-loop approval gate — no silent dependency changes
- One dependency per resolution invocation (blast radius control)
- Instant rollback capability from backup

### Phase 48: Code Absorber
- Criteria gate: <=500 LOC, stable API, pure functions, <=20% of package's API surface
- Oracle testing against 10,000+ generated cases before absorption
- Gradual call-site replacement in <=20% tranches per cycle
- Hard block on crypto, parsers, protocols, compression — never internalize these
- InternalizationRegistry with append-only JSONL tracking

### Phase 49: Integration
- Append-only health.jsonl with mandatory provenance (timestamp + packageVersion + decisionRationale)
- StagingHealthGate for integration with existing staging pipeline
- PatternLearner surfaces pre-emptive warnings after 5+ projects flag the same dependency
- HealthEventWriter with fs.appendFile for crash-safe writes

## Design Decisions

- **One dep per resolution**: Limits blast radius — if something breaks, you know exactly which change caused it
- **Oracle testing before absorption**: 10K+ cases provides high confidence that internalized code behaves identically
- **Hard block on crypto/parsers/protocols/compression**: These categories are too security-sensitive and complex for automated absorption
- **Append-only health log**: Same pattern as telemetry (v1.49.13) — simple, auditable, no schema migrations
- **<=20% tranche replacement**: Gradual call-site migration prevents big-bang breakage
- **Cross-project pattern learning**: After 5+ projects flag the same dependency, the system generates pre-emptive warnings for all projects using it
