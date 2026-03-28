# Cooking with Claude — Wave Execution Plan

**Total Tasks:** 18 | **Parallel Tracks:** 3 | **Sequential Depth:** 5 waves
**Estimated Wall Time:** ~8-10 hours (down from ~20 sequential)
**Critical Path:** 9 sequential sessions

## Wave Summary

| Wave | Tasks | Parallel Tracks | Est. Time | Cache Dependencies |
|------|-------|----------------|-----------|-------------------|
| 0: Foundation | 3 | 1 (sequential) | ~45 min | None — establishes shared types |
| 1: Core Engines | 4 | 2 | ~2 hrs | Wave 0 types |
| 2: Structure & Panels | 5 | 3 | ~3 hrs | Wave 1 engines |
| 3: Departments & Content | 4 | 2 | ~2.5 hrs | Wave 2 structure |
| 4: Integration & Verification | 2 | 1 (sequential) | ~1.5 hrs | All above |

## Wave 0: Foundation (Sequential)

Shared types, schemas, interfaces. Must complete within 5 min TTL.

| Task | Description | Produces | Model | Est. Tokens |
|------|------------|----------|-------|-------------|
| 0.1 | Shared type definitions | `RosettaConcept`, `PanelExpression`, `CalibrationDelta`, `CollegeDepartment`, `SafetyBoundary` types | Haiku | ~5K |
| 0.2 | Panel Interface contract | `PanelInterface` abstract class, registration pattern, expression format standard | Sonnet | ~8K |
| 0.3 | Directory scaffold | `.college/` directory structure, DEPARTMENT.md template, panel stubs, config files | Haiku | ~4K |

**Wave 0 Verification Gate:**
- [ ] All shared types compile (`npx tsc --noEmit`)
- [ ] Panel Interface contract is implementable (smoke test with mock panel)
- [ ] Directory structure matches filesystem contract from milestone spec

---

## Wave 1: Core Engines (Parallel — 2 Tracks)

### Track A: Rosetta Core

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|------------|----------|-------|-------------|------------|
| 1A.1 | Concept Registry | Concept storage, lookup, relationship resolution, panel mapping. CRUD operations for concepts with dependency-aware loading | Sonnet | ~15K | 0.1, 0.2 |
| 1A.2 | Rosetta Core engine | Panel router (selects panels based on user context, domain, requested format), Expression renderer (formats panel output for delivery) | Opus | ~25K | 0.1, 0.2 |

### Track B: Calibration Engine

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|------------|----------|-------|-------------|------------|
| 1B.1 | Calibration Engine core | Universal Observe→Compare→Adjust→Record loop. CalibrationModel interface. Delta storage with persistence. Confidence scoring | Opus | ~20K | 0.1 |
| 1B.2 | Safety Warden framework | Safety boundary enforcement layer. Three modes: annotate (flag), gate (require acknowledgment), redirect (substitute safe alternative). Configurable per domain | Sonnet | ~10K | 0.1 |

**Wave 1 Verification Gate:**
- [ ] Concept Registry stores and retrieves concepts with correct panel mappings
- [ ] Panel router selects appropriate panel given test context vectors
- [ ] Calibration Engine completes a full Observe→Compare→Adjust→Record cycle on mock data
- [ ] Safety Warden blocks, warns, and redirects correctly in all three modes
- [ ] All components compile and pass unit tests

---

## Wave 2: Structure & Panels (Parallel — 3 Tracks)

### Track A: College Structure

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|------------|----------|-------|-------------|------------|
| 2A.1 | College framework | Department loader, wing navigator, progressive disclosure engine (summary→active→deep), try-session runner, cross-reference resolver | Sonnet | ~20K | 1A.1 |
| 2A.2 | Mathematics Department seed | Initial concept set from "The Space Between": exponential growth/decay, trigonometric functions, complex numbers, fractal geometry. Mapped to all active panels. Unit circle architecture integration | Opus | ~25K | 2A.1, 2B.1 |

### Track B: Systems Panels

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|------------|----------|-------|-------------|------------|
| 2B.1 | Python, C++, Java panels | Three systems language panels implementing PanelInterface. Each panel: math library bindings, expression templates, pedagogical annotations, idiomatic examples | Sonnet | ~20K | 0.2, 1A.1 |

### Track C: Heritage Panels

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|------------|----------|-------|-------------|------------|
| 2C.1 | Lisp panel | S-expression concept representation. Homoiconicity demonstration: concepts that ARE data structures. Macro system for concept composition. Pedagogical notes on code-as-data | Opus | ~12K | 0.2, 1A.1 |
| 2C.2 | Pascal and Fortran panels | Pascal: Wirth's pedagogical principles encoded — simplicity, modularity, readability, structured control flow. Fortran: Scientific computing heritage — array operations, numerical methods, direct math expression | Sonnet | ~12K | 0.2, 1A.1 |

**Wave 2 Verification Gate:**
- [ ] College framework loads departments with correct progressive disclosure (summary <3K tokens)
- [ ] Mathematics Department concepts render correctly in Python, C++, and Java panels
- [ ] Lisp panel demonstrates homoiconicity — concept definition IS a manipulable data structure
- [ ] Pascal panel annotations teach structured programming principles
- [ ] Cross-references between Math concepts resolve correctly
- [ ] Token budget stays within 2-5% ceiling per panel load

---

## Wave 3: Departments & Content (Parallel — 2 Tracks)

### Track A: Cooking Department

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|------------|----------|-------|-------------|------------|
| 3A.1 | Cooking Department — 7 wings | Food science, thermodynamics, nutrition, technique, baking science, safety, home economics wings. Each wing: concept set, calibration rules, try-session, safety boundaries | Sonnet | ~35K | 2A.1, 1B.1 |
| 3A.2 | Cooking Calibration Models | Domain-specific models: temperature calibration (thermodynamics), timing calibration (reaction kinetics), seasoning calibration (taste perception), texture calibration (protein/starch science). Integration with Calibration Engine | Opus | ~15K | 1B.1, 3A.1 |

### Track B: Safety & Cross-References

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|------------|----------|-------|-------------|------------|
| 3B.1 | Culinary Safety Warden | Food safety boundaries: temperature danger zone enforcement, allergen flagging, storage time limits, cross-contamination warnings. Three-mode safety (annotate/gate/redirect) configured for cooking domain | Sonnet | ~10K | 1B.2, 3A.1 |
| 3B.2 | Cross-department references | Math↔Cooking concept bridges: exponential decay ↔ cooling curves, ratios ↔ baker's percentages, logarithmic scales ↔ pH in cooking, trigonometric curves ↔ fermentation cycles | Opus | ~10K | 2A.2, 3A.1 |

**Wave 3 Verification Gate:**
- [ ] All 7 cooking wings load and render concepts correctly
- [ ] Cooking calibration models produce correct adjustments for test scenarios (cookies too flat → butter/chill adjustment)
- [ ] Safety Warden blocks unsafe temperature recommendations (poultry below 165°F)
- [ ] Math↔Cooking cross-references navigate correctly in both directions
- [ ] Try-session for "first meal" is completable by a novice user

---

## Wave 4: Integration & Verification (Sequential)

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|------------|----------|-------|-------------|------------|
| 4.1 | Integration bridge | Connect Rosetta Core to skill-creator observation pipeline (exploring code triggers pattern detection), token budget adapter (progressive disclosure respects 2-5% ceiling), chipset adapter (Rosetta panels map to chipset agents) | Sonnet | ~15K | All above |
| 4.2 | Full test suite + verification | 85%+ coverage. Safety-critical tests (mandatory pass). Calibration accuracy tests. Integration tests. Foxfood report — using the system to verify the system | Sonnet | ~15K | All above |

**Wave 4 Verification Gate:**
- [ ] Observation pipeline detects patterns when user explores cooking concepts
- [ ] Token budget stays within limits across all loading scenarios
- [ ] Chipset configuration loads and routes correctly
- [ ] All safety-critical tests pass (zero tolerance)
- [ ] Calibration accuracy ≥80% on test feedback corpus
- [ ] Full test suite passes with 85%+ coverage
- [ ] Foxfood report documents using the system to build itself

---

## Cache Optimization Strategy

### Skill Loads Saved
- Rosetta Core shared types loaded once in Wave 0, cached for all subsequent waves
- Panel Interface contract cached from Wave 0, reused by all panel implementations
- College framework cached from Wave 2, reused by both Math and Cooking departments

### Schema Reuse
- `RosettaConcept` used by: Concept Registry, all panels, College framework, both departments
- `CalibrationDelta` used by: Calibration Engine, all calibration models, Safety Warden
- `PanelExpression` used by: all panels, Expression Renderer, College wing loader

### Pre-Computed Knowledge Tiers
| Tier | Content | Size | Caching |
|------|---------|------|---------|
| Summary | Department overviews, panel list, safety rules, concept index | ~3K | Always in context |
| Active | Current wing concepts, active calibration models, relevant panels | ~12K | Loaded per interaction |
| Reference | Full food science, heritage panel pedagogy, "The Space Between" excerpts | ~50K+ | On explicit request only |

### Token Budget Estimate

| Wave | Est. Tokens | Context Windows | Sessions |
|------|------------|----------------|----------|
| 0 | ~17K | 1 | 1 |
| 1 | ~70K | 3-4 | 2 |
| 2 | ~89K | 4-5 | 2-3 |
| 3 | ~70K | 3-4 | 2 |
| 4 | ~30K | 2 | 1 |
| **Total** | **~276K** | **~14-18** | **~7-9** |

---

## Dependency Graph

```
Wave 0 ─── 0.1 Shared Types ──────────────────────────────┐
  │         0.2 Panel Interface ───────────────────────┐   │
  │         0.3 Directory Scaffold                     │   │
  │                                                    │   │
Wave 1 ─── Track A: 1A.1 Concept Registry ────────┐   │   │
  │                  1A.2 Rosetta Core* ───────────┤   │   │
  │         Track B: 1B.1 Calibration Engine* ─────┤   │   │
  │                  1B.2 Safety Warden Framework ──┤   │   │
  │                                                 │   │   │
Wave 2 ─── Track A: 2A.1 College Framework ────────┤   │   │
  │                  2A.2 Math Department* ─────────┤   │   │
  │         Track B: 2B.1 Systems Panels ──────────┤   │   │
  │         Track C: 2C.1 Lisp Panel* ────────────┤   │   │
  │                  2C.2 Pascal+Fortran Panels ───┤   │   │
  │                                                 │   │   │
Wave 3 ─── Track A: 3A.1 Cooking Department ──────┤   │   │
  │                  3A.2 Cooking Calibration* ────┤   │   │
  │         Track B: 3B.1 Culinary Safety Warden ──┤   │   │
  │                  3B.2 Cross-Dept References* ──┤   │   │
  │                                                 │   │   │
Wave 4 ─── 4.1 Integration Bridge ────────────────┤   │   │
            4.2 Test Suite + Foxfood Report* ──────┘   │   │
                                                       │   │
     * = Opus tasks (critical path)                    │   │
     Critical path: 0.1 → 1A.2 → 2A.1 → 3A.1 → 4.2  │   │
```
