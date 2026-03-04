# Chain Link: v1.36 Citations Pipeline + v1.37 Complex Plane Framework

**Chain position:** 40 of 50
**Milestone:** v1.50.53
**Type:** COMBINED REVIEW — v1.36 + v1.37
**Score:** 4.44/5.0

**Combined review note:** Two versions reviewed together at one chain position. v1.36 (20 commits, 78 files, +15276 lines) and v1.37 (33 commits, 38 files, +10599 lines) are each moderate-sized; combined (53 commits, 115 files, +25874 lines) they fit the chain's review average. Both represent deep, well-scoped subsystem builds with no overlap, making a combined review natural.

---

## Score Trend

```
Pos  Ver    Score  Δ      Commits  Files
 33  v1.29  4.44   -0.06       89   121
 34  v1.30  4.50   +0.06       51    35
 35  v1.31  4.41   -0.09       31   103
 36  v1.32  4.53   +0.12       46    64
 37  v1.33  4.28   -0.25       64   138
 38  v1.34  3.94   -0.34       16   124
 39  v1.35  4.50   +0.56       81   107
 40  v1.36+37 4.44 -0.06       53   115
rolling: 4.380 | chain: 4.273 | floor: 3.32 | ceiling: 4.55
```

## What Was Built

### v1.36 — Citation Management Pipeline (20 commits, 78 files, +15276 lines)

A complete academic citation management system spanning the full lifecycle: extraction, resolution, storage, formatting, discovery, integrity auditing, and dashboard display. 7 plans (351-358), organized as a deep data pipeline.

**Type System & Storage (Plans 351-353, 6 commits):**
- **Zod schema foundation:** 11 schema types — `CitedWorkType` (11 enum values), `SourceApi` (7 APIs), `ExtractionMethod` (9 methods), `ArtifactType` (7 types), plus `Author`, `RawCitation`, `ProvenanceEntry`, and the composite `CitedWork` with full metadata, provenance chains, tags, and verification status. ORCID validation regex, year range [1400, 2100], confidence [0, 1].
- **Citation store (citation-db.ts):** JSONL-backed persistence with title similarity matching (Levenshtein-based) for deduplication. Indexed by DOI, ISBN, and tag for O(1) lookups.
- **Provenance chain tracker:** Bidirectional provenance queries — find all artifacts citing a work, or all works cited by an artifact. Links citations to their source documents with context and timestamps.
- **Directory scaffold:** `.citations/db/`, `.citations/exports/`, `.citations/provenance/` with gitkeep.

**Extraction & Resolution (Plans 352-354, 5 commits):**
- **Extraction patterns:** DOI detector (`10.\d{4,}/...`), URL resolver, inline APA pattern matching, bibliography parser with deduplication.
- **Parser orchestrator:** Coordinates multiple extraction methods, deduplicates raw citations, assigns confidence scores per extraction method.
- **Resolver adapter interface:** Clean port pattern with `resolve()` and `search()` methods, `SearchOptions`, and metrics tracking.
- **6 resolver adapters:** CrossRef (DOI priority), OpenAlex (open access), NASA NTRS (technical reports), GitHub (repository metadata), Archive.org (URL-based), generic web (fallback text parsing). Each implements the adapter interface.
- **Resolution cascade engine:** Confidence-based cascade — accept at >= 0.70, continue trying at [0.50, 0.70), unresolved below 0.50. Batch resolution with deduplication and API metrics tracking.
- **Dedup module:** Title similarity with configurable threshold (0.92 default).

**Formatting & Output (Plans 355-357, 5 commits):**
- **Bibliography formatter orchestrator:** Pluggable format registry with scope filtering (all/document/domain), sort options (author/year/title), and verified-only toggle.
- **5 format renderers:** BibTeX (machine-readable), APA7 (psychology standard), Chicago (humanities), MLA (literature), custom (template-based). All registered at construction, overridable via `registerFormat()`.
- **Attribution report generator:** Produces human-readable attribution documentation.
- **Integrity auditor:** Cross-references `[CITE:id]` markers and DOI patterns against the store. Detects broken references, finds orphaned works, calculates completeness score = resolved/total, generates actionable recommendations.

**Integration & Dashboard (Plans 356-358, 4 commits):**
- **Learn pipeline hooks:** Citation annotation injector, knowledge tier linker, learn hook that intercepts `sc:learn` to extract and track citations from ingested material.
- **Discovery engine:** Parallel multi-API search with `Promise.allSettled`, deduplication by DOI and title similarity, store presence marking, confidence-sorted results. Citation graph walker for related work discovery.
- **CLI commands:** Citation search, bibliography generation, integrity audit.
- **Dashboard panel:** Citation count, format distribution, integrity badges (verified/unverified/broken ratios). Provenance viewer for tracing citation lineage.
- **Chipset YAML:** Citation management chipset configuration.
- **E2E integration tests:** Full pipeline test (extract → resolve → store → generate → audit) with mocked API responses, temp directory isolation.

### v1.37 — Complex Plane Learning Framework (33 commits, 38 files, +10599 lines)

A mathematically grounded skill positioning framework using real trigonometry — versine zones, exsecant reach, tangent distances, Euler multiplication — to map skills onto the complex plane. 8 plans (359-366), organized as a mathematical computation pipeline.

**Core Mathematics (Plans 359, 5 commits):**
- **Type system:** `SkillPosition` (theta, radius, angularVelocity), `TangentContext` (slope, reach, exsecant, versine), `TangentMatch`, `ChordCandidate` (arc vs chord savings), `PromotionDecision`, `AngularObservation`, `PlaneMetrics`. All Zod-validated.
- **Constants:** `MAX_REACH=100`, `MIN_THETA=0.01`, `MAX_ANGULAR_VELOCITY=0.2`, `MATURITY_THRESHOLD=50`. Guard values for division-by-zero and infinity clamping.
- **Promotion regions:** Four-region tiling of [0, pi/2] — CONVERSATION [3pi/8, pi/2], SKILL_MD [pi/6, 3pi/8], LORA_ADAPTER [pi/16, pi/6], COMPILED [0, pi/16]. No gaps or overlaps.
- **Arithmetic library (19 pure functions):** `createPosition`, `normalizeAngle`, `estimateTheta` (atan2-based), `estimateRadius`, `computeTangent` (slope=-cot(theta), reach=sec(theta), versine=1-cos(theta), exsecant=sec(theta)-1), `pointToTangentDistance`, `computeTangentScore`, `composePositions` (Euler multiplication: theta adds, radius multiplies), `arcDistance`, `chordLength`, `versine`, `exsecant`, `classifyByVersine`, `getPromotionLevel`, `computeAngularStep`, `computePlaneMetrics`, plus helpers. All pure, deterministic, side-effect-free. Epsilon guards (1e-10) prevent division-by-zero. MAX_REACH clamping prevents infinity.

**Signal Pipeline (Plans 360-361, 8 commits):**
- **Task vector analysis:** Analyzes tool-use patterns to classify concrete (file edits, bash commands) vs abstract (reasoning, planning) signals.
- **Signal classification:** Maps signal types to concrete/abstract buckets, computes theta estimate from ratio.
- **Enhanced scoring integration:** `computeEnhancedScore` blends semantic score with geometric plane position. Null-safe — falls back to semantic-only when position unavailable.
- **Observer angular bridge:** Connects observer pattern groups to angular observations. Velocity clamping enforces MAX_ANGULAR_VELOCITY (20% rule). Initial position assignment for new skills.
- **Position store:** JSON-file-backed persistence with load/save/get/set/all operations.

**Composition & Promotion (Plans 362-363, 8 commits):**
- **Angular promotion evaluator:** 7-check evaluation sequence for promoting skills between angular regions. Evidence-based with versine gap and exsecant reach geometric context.
- **Chord detection:** Identifies frequently co-activated skill pairs. Arc distance vs chord length savings quantify composition benefit. ChordStore for persistence.
- **Euler composition engine:** Full pipeline — complex multiplication of positions, quality assessment (excellent/good/marginal/poor), composite suggestions with naming (common-prefix or alphabetical join), human-readable explanations referencing versine zones and promotion levels.
- **Angular refinement wrapper:** Content direction analysis for fine-grained angular positioning.

**Dashboard, Migration & Safety (Plans 364-366, 12 commits):**
- **Dashboard metrics:** Versine distribution (grounded/working/frontier), average exsecant, angular velocity warnings, chord candidate listing.
- **Snapshot persistence:** Dashboard state snapshots for trend tracking.
- **Terminal rendering:** `plane-status` CLI command with `--json`, `--snapshot`, `--detail` flags.
- **Skill migration analyzer:** 6 exported content analysis helpers (pure functions: `countCodeBlocks`, `countExplicitCommands`, `countFilePaths`, `countSemanticDescriptions`, `countConditionalLogic`, `isPhaseContext`). Trigger analysis → content analysis → promotion level override → theta/radius computation. Optional history enhancement (40% content + 60% history blend).
- **Plane migration executor:** `migrateAll()` with CLI handler. Converts existing skills to plane positions.
- **12 E2E integration tests (INT-01..INT-12):** Full cross-component wiring — Observer→Bridge→Store, Bridge→Activation→Score, Chord→Composition→Suggestion, Migration→Store→Metrics, Dashboard→Render.
- **12 safety-critical tests (SC-01..SC-12):** Backward compatibility (skills without positions), graceful degradation (missing positions.json), NaN/Infinity guards, angular velocity bounds, migration idempotency, non-destructive migration. Tests use temp directories, no external state.
- **Barrel exports:** Careful re-export handling for PositionStorePort collision between chords.ts and promotion.ts (aliased as ChordPositionStorePort).

## Dimension Scores

| Dimension | Score | Notes |
|-----------|-------|-------|
| Architecture | 4.5 | Two deep pipelines: citations (extract→resolve→store→format→discover→audit) and plane (types→arithmetic→signals→position→compose→promote→migrate). Both use dependency injection, port/adapter patterns, and zero-dependency core modules |
| Code Quality | 4.5 | Zod schemas throughout both systems. Arithmetic library is exemplary — 19 pure functions with epsilon guards and MAX_REACH clamping. Bibliography formatter has pluggable format registry. Discovery uses Promise.allSettled for parallel queries |
| Testing | 4.5 | 16 test-first commits precede 34 feat commits (strong TDD). 12 E2E + 12 safety-critical tests for the plane cover backward compat, graceful degradation, NaN guards, velocity bounds, migration idempotency. Citation E2E with mocked APIs |
| Documentation | 4.0 | Comprehensive JSDoc on all exports. Module-level documentation explains mathematical models (versine zones, exsecant reach, Euler multiplication). Types files serve as self-documenting schemas. No standalone prose documentation |
| Integration | 4.0 | Each system integrates well internally. Citations hook into learn pipeline, dashboard, CLI. Plane integrates with observer, score-stage, CLI, dashboard. No cross-system linkage between citations and plane — independent modules |
| P6 Composition | 4.5 | Two deep complementary pipelines — citations is a classic data pipeline (ETL + query + display), plane is a mathematical computation pipeline (observe → classify → position → compose → promote → migrate). Both use adapter pattern. Euler engine is literally about composition |
| P14 ICD | 4.5 | Clean type interfaces via Zod. ResolverAdapter interface for pluggable resolution. CitationStorePort avoids circular deps. PositionStorePort used by chords and promotion with aliased barrel re-export. BibliographyFormat registry |
| P11 Forward-only | 5.0 | 0 fix commits across 53 total. Every commit is test() or feat(). Perfect forward-only development |

**Combined: 4.44/5.0**

## Key Technical Details

**Mathematical Grounding (v1.37):** The complex plane mapping uses real trigonometry, not superficial analogy. Versine (1-cos(theta)) measures groundedness on [0,2]. Exsecant (sec(theta)-1) measures excess reach beyond the unit circle. Tangent distance provides perpendicular distance to skill tangent lines for relevance scoring. Euler multiplication (theta adds, radius multiplies) follows actual complex number arithmetic. The promotion regions tile [0, pi/2] without gaps. This is genuine mathematical structure, not naming convention.

**Resolution Cascade (v1.36):** The confidence-based cascade (accept >= 0.70, continue [0.50, 0.70), reject < 0.50) is a clean decision boundary that prevents false positives while allowing low-confidence results to improve through additional adapters. The 7-adapter stack provides coverage across academic (CrossRef, OpenAlex), government (NASA NTRS), archive (Archive.org, GitHub), and web sources.

**Safety-Critical Tests:** SC-02 through SC-05 verify the critical backward-compatibility property: skills without positions, missing positions.json, empty stores, and absent observer bridges all degrade gracefully to semantic-only scoring. No NaN, no Infinity, no crash. This is defensive design that protects existing functionality during migration.

## Pattern Observations

**P6 composition** — Both versions exhibit deep composition patterns. The citation pipeline composes extractors, resolvers, formatters, and auditors into a coherent data flow. The plane system literally implements Euler composition as its core concept. This is the project's strongest pattern continuing.

**P11 forward-only** — Perfect 0/53 fix ratio. 16 test-first commits establish behavior contracts before 34 feat commits implement them. No rework, no corrections. This is the strongest P11 score possible.

**P14 ICD** — Port/adapter patterns in both systems (ResolverAdapter, CitationStorePort, PositionStorePort, FormatRenderer) demonstrate clean interface discipline. The barrel export collision handling (PositionStorePort aliased as ChordPositionStorePort) shows attention to namespace management.

**Independent modules:** v1.36 and v1.37 share zero code between them. No imports cross the boundary. This is correct — citations and plane positioning serve different concerns. The combined review confirms they were developed as genuinely independent subsystems.

## Chain Context

Position 40 marks 80% completion of the 50-link chain. The score (4.44) maintains the high band established since the v1.35 recovery (+0.56). Rolling average (4.380) and chain average (4.273) both remain stable. The combined review format works well for moderate-sized versions that would individually be thin reviews.

The chain has now reviewed: learning pipeline (v1.35), citations (v1.36), and complex plane (v1.37). Together these three versions build the intellectual infrastructure — mathematical primitives, citation tracking, and geometric skill positioning — that the later versions will integrate.

---

*Reviewed at chain position 40/50. Combined review: v1.36 (20 commits) + v1.37 (33 commits) = 53 commits, 115 files, +25874 lines.*
