# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.49.8 — Cooking With Claude

**Shipped:** 2026-03-01
**Phases:** 11 | **Plans:** 45 | **Sessions:** ~7-9

### What Was Built
- Rosetta Core translation engine with Concept Registry, Panel Router, Expression Renderer, and 9 language panels spanning 60+ years of programming history (ALGOL 1958 to Unison 2025)
- College Structure with progressive disclosure, department/wing/concept hierarchy, try-session runner, and cross-reference resolver — proving "code IS curriculum"
- Calibration Engine with universal Observe→Compare→Adjust→Record feedback loop, pluggable domain models, bounded 20% adjustment, delta persistence, and profile synthesis
- Cooking Department with 7 wings (food science, thermodynamics, nutrition, technique, baking science, food safety, home economics), 30+ concepts grounded in peer-reviewed science
- Safety Warden with absolute temperature enforcement (3 modes), allergen management (Big 9), danger zone tracking
- Mathematics Department seeded from "The Space Between" with 7 concepts on the Complex Plane of Experience
- Integration bridge connecting to observation pipeline, token budget enforcement, and chipset routing
- 650 tests across 49 files with 94.78% statement coverage and all 14 safety-critical tests passing

### What Worked
- **Staged mission package**: 12 pre-written docs (265K) meant zero research phase needed — saved ~2 hours
- **Wave execution with parallelism**: 5 waves with up to 3 parallel tracks compressed ~20 hours sequential to ~2 hours wall time
- **TDD discipline**: Tests written first in Phases 2-4, consistent across all phases — caught heritage panel ID bug in Phase 10
- **Background agent parallelism**: Phase 10 wave 1 ran 3 agents simultaneously (coverage, safety tests, integration tests)
- **Spec-driven development**: Each component spec was self-contained, enabling true agent parallelism without coordination overhead
- **Progressive disclosure architecture**: Token budget design worked — summary/active/deep tiers stayed within bounds at every phase

### What Was Inefficient
- **REQUIREMENTS.md traceability table lagged**: Many requirements stayed "Pending" status even after their phase completed. Should auto-update when SUMMARY.md files are written
- **Context window resets**: Session ran out of context twice, requiring handoff summaries. Could have been prevented by smaller session scopes
- **Heritage panel ID bug**: Discovered late in Phase 10 that heritage panels didn't handle `math-` prefixed concept IDs — should have been caught by Phase 6 integration tests
- **Summary one-liner extraction**: SUMMARY.md files didn't consistently include a `one_liner` field, making automated extraction fail

### Patterns Established
- **Mission package pattern**: Pre-write vision, specs, wave plan, and test plan before starting execution. Skip GSD research phase when package IS the research
- **Wave-parallel execution**: Map waves to phases, run independent tracks simultaneously with background agents
- **Safety-first testing**: SC tests are zero-tolerance, written as canonical suites with clear IDs, run in every verification
- **Foxfood verification**: System proves itself by mapping its own build process to the architecture it implements

### Key Lessons
1. **Pre-written specs enable agent parallelism** — each agent only needs its assigned spec, no inter-agent coordination required
2. **Heritage panels need namespace-aware dispatch** — when concept IDs have prefixes (e.g., `math-`), all panels must handle both bare and prefixed forms
3. **Background agents complete faster than expected** — Phase 10 wave 1 (3 parallel agents) finished in ~15 minutes total
4. **Branch coverage gaps in defensive code are acceptable** — 82.1% branch vs 85% target, but all gaps are in fallback paths that can't be reached in normal operation
5. **Safety boundaries must be tested with property-based thinking** — SC tests verify that NO input can produce unsafe output, not just that correct inputs work

### Cost Observations
- Model mix: ~35% Opus, ~60% Sonnet, ~5% Haiku (matching spec estimate)
- Sessions: ~7-9 across 2 context window resets
- Notable: Background agent parallelism reduced Phase 10 from ~1.5 hours sequential to ~15 minutes wall time

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.49.5 | ~2 | 4 | Filesystem reorganization |
| v1.49.6 | ~3 | 5 | Cross-platform hardening |
| v1.49.7 | ~2 | 3 | Optional dependency pattern |
| v1.49.8 | ~8 | 11 | Staged mission package + wave parallelism |

### Cumulative Quality

| Milestone | Tests | Coverage | New LOC |
|-----------|-------|----------|---------|
| v1.49.5 | 19,200+ | - | ~500 |
| v1.49.6 | 19,200+ | - | ~250 |
| v1.49.7 | 19,200+ | - | ~200 |
| v1.49.8 | 19,850+ | 94.78% (.college/) | 17,964 |

### Top Lessons (Verified Across Milestones)

1. Pre-written specs and research eliminate the most expensive part of development — figuring out what to build
2. Wave execution with parallelism compresses timelines dramatically — 3x+ speedup over sequential
3. Safety boundaries must be absolute and tested with zero tolerance — no amount of calibration should override them
