# NASA Mission Series — Wave Execution Plan

**Date:** 2026-03-29
**Milestone:** NASA Mission Series
**Activation Profile:** Fleet (17 roles)
**Cache Strategy:** Prefix all downstream contexts with shared schemas from Wave 0

---

## Wave Summary

| Wave | Name | Mode | Model | Output |
|------|------|------|-------|--------|
| 0 | Foundation | Sequential | Haiku | Shared schemas, branch setup, mission catalog skeleton |
| 1 | Catalog & Pipeline | Parallel (2 tracks) | Sonnet/Opus | Mission catalog index, pipeline executor, release engine, retro system |
| 2 | Factory & Integration | Parallel (2 tracks) | Opus/Sonnet | Skill factory, dataset integration, educational output, upstream sync |
| 3 | Safety & Verification | Sequential | Opus/Sonnet | Safety Warden, integration verification, first release dry-run |

---

## Wave 0: Foundation (Sequential — Must complete < 5 min)

*Produces all shared artifacts that downstream waves consume from cache.*

| Task | Description | Produces | Model | Est. Tokens |
|------|-------------|----------|-------|-------------|
| 0.1 | Shared types and schemas | `types/nasa-mission.ts`, `types/release-cycle.ts`, `types/pipeline-part.ts` | Haiku | ~4K |
| 0.2 | Branch infrastructure setup | `.github/workflows/nasa-sync.yml`, branch creation script, push config | Haiku | ~4K |
| 0.3 | Directory skeleton | `docs/nasa/`, `skills/nasa/`, `chipsets/nasa/`, `college/nasa/`, `docs/TSPB/`, `.planning/nasa/` | Haiku | ~2K |

**Wave 0 Gate:** All type definitions compile (`npx tsc --noEmit`). Branch infrastructure script executes without error. Directory skeleton exists.

---

## Wave 1: Catalog & Pipeline Definition (Parallel — 2 Tracks)

*All tracks start immediately after Wave 0. No inter-track dependencies.*

### Track A: Catalog & Release Infrastructure

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|-------------|----------|-------|-------------|------------|
| 1A.1 | Mission catalog index (all 73 entries) | `docs/nasa/catalog/mission-index.json`, `docs/nasa/catalog/README.md` | Sonnet | ~25K | 0.1 |
| 1A.2 | Release cadence engine | `scripts/nasa-release.sh`, release note template, version bump logic | Sonnet | ~20K | 0.1, 0.2 |

### Track B: Pipeline & Retrospective Architecture

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|-------------|----------|-------|-------------|------------|
| 1B.1 | Per-mission pipeline executor | `skills/nasa/pipeline-executor/SKILL.md`, part routing logic, CAPCOM gate definitions | Opus | ~40K | 0.1 |
| 1B.2 | Retrospective system | `skills/nasa/retrospective/SKILL.md`, 8-pass template, lessons-forward linking schema | Opus | ~30K | 0.1 |

**Wave 1 Gate:** Catalog validates against JSON schema. Pipeline executor handles all 7 parts. Release script creates valid tags. Retrospective template supports all 8 passes.

---

## Wave 2: Factory & Integration (Parallel — 2 Tracks)

*Builds the systems that generate skills, integrate datasets, and produce educational output.*

### Track A: Factory & Education

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|-------------|----------|-------|-------------|------------|
| 2A.1 | Skill/Agent/Team/Chipset Factory | `skills/nasa/factory/SKILL.md`, generation templates, iterative improvement engine | Opus | ~35K | 1B.1, 1B.2 |
| 2A.2 | Educational output generator | `skills/nasa/edu-generator/SKILL.md`, TRY Session template, DIY project template, College format adapters | Sonnet | ~25K | 1B.1 |

### Track B: Data & Sync

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|-------------|----------|-------|-------------|------------|
| 2B.1 | NASA dataset integration (Part H) | `skills/nasa/dataset-integrator/SKILL.md`, API connectors (Horizons, PDS, NTRS, HEASARC), sample queries | Sonnet | ~30K | 0.1, 1A.1 |
| 2B.2 | Upstream sync engine | `scripts/nasa-sync-main.sh`, merge strategy, conflict resolution guide, sync verification | Sonnet | ~15K | 0.2, 1A.2 |

**Wave 2 Gate:** Factory generates a valid SKILL.md from test input. Dataset integrator retrieves data from at least one NASA API. Educational generator produces a valid TRY Session. Sync engine completes a test merge.

---

## Wave 3: Safety & Verification (Sequential — Safety Warden on critical path)

*Assembles all components. Safety Warden has final BLOCK authority.*

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|-------------|----------|-------|-------------|------------|
| 3.1 | Safety Warden configuration | `skills/nasa/safety-warden/SKILL.md`, disaster narrative rules, biosignature boundary rules, ITAR exclusion rules, cultural sensitivity rules | Opus | ~25K | All Wave 2 |
| 3.2 | Integration & verification | End-to-end dry run: execute v1.0 pipeline for NACA→NASA founding; verify all artifacts produced; test release cycle; verify main sync | Sonnet | ~20K | 3.1 |
| 3.3 | CAPCOM review package | Package all component specs, templates, and dry-run output for human review | Sonnet | ~5K | 3.2 |

**Wave 3 Gate:** Safety Warden blocks a test case with incorrect Challenger facts. Integration test produces all required artifacts for v1.0 dry run. CAPCOM review package complete.

---

## Post-Wave: First Real Release (nasa-v1.0)

After Wave 3 CAPCOM approval, the first real release begins:

| Task | Description | Model | Est. Tokens |
|------|-------------|-------|-------------|
| v1.0-A | Part A: NACA → NASA founding history | Sonnet | ~20K |
| v1.0-B | Part B: Explorer 1 science context (bundled with founding) | Sonnet | ~15K |
| v1.0-C | Part C: Educational curriculum for agency founding | Sonnet | ~15K |
| v1.0-D | Part D: Engineering — early rocket engineering, V-2 heritage | Opus | ~25K |
| v1.0-E | Part E: Simulation — orbital mechanics basics, trajectory visualization | Sonnet | ~20K |
| v1.0-F | Part F: Mission operations — early tracking networks, Mercury Control | Sonnet | ~20K |
| v1.0-G | Part G: First retrospective (abbreviated — no prior releases to refine) | Opus | ~15K |
| v1.0-H | Part H: NASA.gov integration, NSSDC data access, NASA Open Data API | Sonnet | ~15K |
| v1.0-REL | Release: notes, tag, push, sync from main | Haiku | ~5K |

*Total v1.0 estimate: ~150K tokens across ~5 sessions*

---

## Steady-State Release Cadence (v1.1+)

Each subsequent release follows the same pattern but benefits from accumulated skills and templates:

```
STEADY-STATE PER-RELEASE ESTIMATE
===================================

Part A (History):      ~15-25K tokens (1 session)
Part B (Science):      ~15-20K tokens (1 session)
Parts C+D (parallel):  ~20-30K tokens each (1-2 sessions)
Parts E+F (parallel):  ~15-25K tokens each (1-2 sessions)
Part G (Refinement):   ~15-20K tokens (1 session)
Part H (Datasets):     ~10-20K tokens (1 session)
Release + Sync:        ~5-10K tokens

Total per release:     ~110-175K tokens
Sessions per release:  ~3-5
Wall clock per release: Variable (verbosity > speed)

Total series estimate:
  73 releases × ~140K avg = ~10.2M tokens
  73 releases × ~4 sessions avg = ~290 sessions
```

---

## Cache Optimization Strategy

### Skill Loads Saved
- Pipeline executor skill loaded once per release → cached for all 7 parts
- Safety Warden rules loaded once → cached across all parts
- Mission catalog index (summary tier) always in context → no reload

### Schema Reuse
- `types/nasa-mission.ts` defined in Wave 0 → consumed by all downstream components
- `types/pipeline-part.ts` defined in Wave 0 → consumed by pipeline executor, factory, educational generator
- Release note template defined in Wave 1 → reused across all 73 releases

### Progressive Context Loading
- Release N's retrospective loaded at start of Release N+1 (most recent only to save context)
- Full retrospective chain available on demand but not default-loaded
- Part B output cached for Parts C, D, E, F consumption within same release

### Token Budget Estimate (Infrastructure Build — Waves 0-3)

| Wave | Opus (K) | Sonnet (K) | Haiku (K) |
|------|----------|------------|-----------|
| Wave 0 | — | — | 10 |
| Wave 1A (Catalog + Release) | — | 45 | — |
| Wave 1B (Pipeline + Retro) | 70 | — | — |
| Wave 2A (Factory + Edu) | 35 | 25 | — |
| Wave 2B (Data + Sync) | — | 45 | — |
| Wave 3 (Safety + Verify) | 25 | 25 | — |
| Contingency (15%) | 20 | 21 | 2 |
| **Total** | **150K** | **161K** | **12K** |
| **Grand Total (Infrastructure):** | | | **~323K** |

---

## Dependency Graph

```
DEPENDENCY GRAPH
================

W0: SHARED TYPES + BRANCH INFRA + SKELETON (Haiku)
  |
  +---> W1A: CATALOG INDEX (Sonnet, OSPREY+CEDAR)
  |        |
  |        +---> W1A: RELEASE CADENCE (Sonnet, WREN)
  |
  +---> W1B: PIPELINE EXECUTOR (Opus, RAVEN+PLAN)
  |        |
  |        +---> W1B: RETRO SYSTEM (Opus, HERON)
  |
  [SYNC GATE: All Wave 1 complete]
  |
  +---> W2A: SKILL FACTORY (Opus, WOLF)
  |        |                 \
  |        |                  +---> depends on 1B.1, 1B.2
  |        |
  |        +---> W2A: EDU GENERATOR (Sonnet, HEMLOCK)
  |                                   \
  |                                    +---> depends on 1B.1
  |
  +---> W2B: NASA DATASET INTEGRATION (Sonnet, ORCA)
  |        |                            \
  |        |                             +---> depends on 0.1, 1A.1
  |        |
  |        +---> W2B: SYNC ENGINE (Sonnet, WREN)
  |                                \
  |                                 +---> depends on 0.2, 1A.2
  |
  [SYNC GATE: All Wave 2 complete]
  |
  v
W3: SAFETY WARDEN (Opus, OWL) ← Critical path; BLOCK authority
  |
  v
W3: INTEGRATION VERIFICATION (Sonnet, HAWK+VERIFY)
  |
  v
W3: CAPCOM REVIEW (Human gate, FOXGLOVE)
  |
  v
INFRASTRUCTURE COMPLETE → Begin nasa-v1.0
  |
  v
[v1.0] → [sync] → [v1.1] → [sync] → [v1.2] → ... → [v1.72] → CATALOG COMPLETE
```
