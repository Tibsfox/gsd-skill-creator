# v1.35 Retrospective — Mathematical Foundations Engine

**Shipped:** 2026-02-26
**Phases:** 16 | **Plans:** 50 | **Sessions:** 2

### What Was Built
- Mathematical Foundations Engine: 451 primitives across 10 domains, 8 engines (dependency graph, path finder, plane classifier/navigator, composition, proof composer, verification, property checker)
- Transparent pipeline integration with tiered knowledge loading (4K/15K/40K) and 10 auto-generated domain skill files
- `sc:learn` generalized knowledge ingestion: 7-stage pipeline (acquire → sanitize → HITL → analyze → extract → dedup → generate) supporting PDF, markdown, docx, txt, epub, archives, GitHub URLs
- `sc:unlearn` reversible knowledge sessions with changeset manager and graph integrity validation
- Safety verification suite: Magic Test (SAFE-05), Euclid's Test (SAFE-06), self-validation 96.2% (SAFE-07), security stress 31 vectors (SAFE-08)

### What Worked
- **7-wave execution with max 4 parallel tracks**: 50 plans completed in ~150 min wall clock; parallel waves (W1: 3 tracks, W2: 4 tracks, W5: 3 tracks) maximized throughput
- **Pre-built mission package from VTM pipeline**: Skipping research phase entirely — the 50-task package was consumed directly by new-milestone, saving ~30 min
- **DependencyGraphPort interface pattern**: Decoupling composition engine from graph engine allowed W2 phases (339-342) to execute in parallel despite logical dependency
- **Injectable function patterns (PromptFn, GraphIntegrityValidator)**: Made HITL gate and changeset manager fully testable without CLI I/O or filesystem state
- **TDD RED-GREEN cycle**: Every module has test-first coverage; 631 tests caught issues at authoring time, not integration time
- **Autonomous executor agents**: Zero human intervention across all 50 plans; all deviations auto-fixed by executors

### What Was Inefficient
- **gsd-tools milestone complete bugs persist**: Wrong phase/plan counts (counts global, not milestone), wrong accomplishments (from old phases), appends at bottom instead of top. Manual fixup required every milestone
- **Module-level JSON imports in tests**: Multiple phases (345, 347) hit the same vi.mock issue for domain-index.json. Could have established the pattern once in a shared test helper
- **Plan specification drift**: Phase 350 plans referenced stale function names (processHitlGate → hitlGate). Plans written weeks before execution accumulate interface drift
- **Pre-filter threshold mismatch**: Phase 350-01 self-validation needed maxDistance 1.5 instead of plan's 0.3 because analyzer produces domain-averaged positions — a design assumption not visible until integration

### Patterns Established
- **Wave 0 type-first pattern**: Pure type definitions in Wave 0 before any parallel work prevents interface mismatch across parallel tracks
- **Domain-prefixed primitive IDs**: `{domain}-{concept-name}` convention enables O(1) domain lookup from any primitive ID
- **STRANGER-tier hygiene for internet content**: 6 check categories (prompt injection, hidden chars, embedded code, external resources, path traversal, content-type) with HOME tier abbreviated for trusted sources
- **Pipeline fence tests**: Verify architectural contracts at boundaries via report.passed signal, not internal mock calls
- **Pluggable heuristic registry**: ContentType-keyed pattern for extensible domain-specific behavior without modifying core extraction

### Key Lessons
1. **Interface ports enable parallel engine development**: DependencyGraphPort allowed composition engine to be built in parallel with the graph engine it depends on — contract-first design pays for itself in parallelization
2. **Pre-filter AND logic reduces false positives dramatically**: Requiring BOTH proximity AND keyword overlap (not OR) dropped false dedup matches from ~40% to <5%
3. **merge() vs resolveConflict() separation is a safety invariant**: Making automatic merge unable to produce 'replace' actions ensures no silent overwrites — only explicit user conflict resolution can overwrite
4. **Self-validation as quality gate works well**: Running sc:learn against the manually-extracted MFE registry validates the generalized pipeline produces equivalent quality (96.2% ≥ 95% threshold)
5. **Documentation-heavy milestones and code-heavy milestones execute at similar velocity**: v1.34 (docs-only, 9 phases, ~40 min) and v1.35 (code-heavy, 16 phases, ~150 min) both completed in single sessions with consistent throughput

### Cost Observations
- Model mix: ~40% Opus (domain extraction, engine design), ~55% Sonnet (schema, integration, CLI), ~5% Haiku (validation checks)
- Sessions: 2 (context overflow at Wave 5 boundary, resumed cleanly)
- Notable: 16 phases in ~150 min = ~9.4 min/phase average; wave parallelism provides ~3x speedup over sequential

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.40 | 1 | 6 | First zero-deviation milestone; first fully autonomous (0 human interventions); dogfood pipeline proving all patterns end-to-end |
| v1.37 | 1 | 8 | Complex plane geometry model; PositionStorePort decoupling; 5-wave execution; 16,100 regression tests green |
| v1.36 | 1 | 8 | Fastest per-plan velocity (3 min/plan); single-session 16-plan execution; fault-isolated pipeline hooks |
| v1.35 | 2 | 16 | Pre-built mission package; 7-wave execution; DependencyGraphPort parallel pattern |
| v1.34 | 1 | 9 | Documentation-only milestone; gsd-executor agents handle docs efficiently |
| v1.33 | 1 | 14 | Pre-built mission package from VTM; 6-wave parallel execution |
| v1.32 | 2 | 7 | Osborn's rules enforced architecturally; session-scoped bus |

### Cumulative Quality

| Milestone | Tests | Source LOC | Key Quality Metric |
|-----------|-------|-----------|-------------------|
| v1.40 | 362 | ~7.2K | 44/44 requirements, 0 deviations, 16,795 regression green, 4/4 safety checks |
| v1.37 | 446 | ~9.7K | 50/50 requirements, 6 auto-fixed deviations, 16,100 regression green |
| v1.36 | 280 | ~14.2K | 71/71 requirements, 7 auto-fixed deviations, 0 manual fixes |
| v1.35 | 631 | ~9.7K | 43/43 requirements, 96.2% self-validation |
| v1.34 | 0 | 0 (docs) | 502 cross-refs validated, 0 broken |
| v1.33 | 216 | ~5.9K | 118/118 chipset validation checks |
| v1.32 | 321 | ~16K | <5% false positive rate on evaluative detection |

### Top Lessons (Verified Across Milestones)

1. **Pre-built mission packages save ~30 min per milestone** — VTM output consumed directly (v1.33, v1.35, v1.36, v1.37, v1.40)
2. **Wave parallelism provides ~3x throughput** — Consistent across v1.33 (6 waves), v1.35 (7 waves), v1.36 (4 waves), v1.37 (5 waves), v1.40 (4 waves)
3. **Interface ports enable maximum parallelism** — DependencyGraphPort (v1.35), CitationStorePort (v1.36), PositionStorePort (v1.37), all proven
4. **Autonomous executor agents handle all complexity levels** — Zero human intervention across 50+ plans per milestone; v1.40 first fully hands-free milestone
5. **TDD catches integration issues at authoring time** — Reducing rework across all code-heavy milestones; v1.40 achieved zero deviations
6. **Fault isolation for optional pipeline stages** — SAFE-06 pattern (v1.36) should be standard for all non-critical hooks
7. **Test contracts coordinate parallel agents** — When phases race to create shared files, test expectations serve as the coordination mechanism (proven in v1.40)
8. **Safety constraints as data validations, not runtime enforcement** — Pure assertions on final data structures make safety trivially testable (proven in v1.40)
9. **16-plan milestones complete in single session** — Confirmed across v1.36, v1.37, v1.40; boundary is ~16-20 plans per context window
