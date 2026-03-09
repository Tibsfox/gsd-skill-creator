# v1.35 — Mathematical Foundations Engine

**Shipped:** 2026-02-26
**Phases:** 335-350 (16 phases) | **Plans:** 50 | **Commits:** 79 | **Requirements:** 43 | **Tests:** 631 | **LOC:** ~9.7K source + ~13.1K test + ~21.4K data + ~1.2K skills

451 typed mathematical primitives from The Space Between encoded in a navigable dependency graph with composition, proof, and verification engines transparently integrated into skill-creator's pipeline, plus `sc:learn` generalized knowledge ingestion and `sc:unlearn` reversible sessions.

### Key Features

**Primitive Registry & Dependency Graph (Phases 335-337):**
- 451 primitives across 10 domains (Perception, Waves, Change, Structure, Reality, Foundations, Mapping, Unification, Emergence, Synthesis)
- Coverage of all 33 chapters of The Space Between
- 106 dependency edges, DAG builder with Dijkstra path finder

**Mathematical Engines (Phases 338-342):**
- Complex Plane classifier/navigator
- Composition engine (sequential/parallel/nested)
- Proof composer (formal reasoning chains)
- Verification engine (dimensional/type/domain checks)
- Property checker library (5 mathematical properties)

**Pipeline Integration (Phases 343-344):**
- MFE activates as skill type in 6-stage pipeline
- Tiered knowledge loading respecting 2-5% token budget (4K summary / 15K active / 40K reference)
- 10 progressive disclosure domain skill files generated

**sc:learn Generalized Ingestion (Phases 345-348):**
- Acquire: PDF, Markdown, docx, txt, epub, zip, tgz, GitHub
- Sanitize: STRANGER-tier security with 6 attack categories
- HITL gate, analyze (structure/type/domain/plane)
- Extract + wire dependencies, deduplicate + merge
- Generate skills/agents/teams, report with provenance

**sc:unlearn Reversible Sessions (Phase 349):**
- Changeset manager for session-scoped rollback
- Graph integrity validation
- Skill regeneration after removal

**Safety-Critical Tests (Phase 350):**
- SAFE-04: 5% budget cap enforcement
- SAFE-05 Magic Test: zero MFE leakage in user output
- SAFE-06 Euclid's Test: decompose-compose round trip
- SAFE-07 self-validation: 96.2% duplicate detection
- SAFE-08 security stress: 31 attack vectors blocked across 6 categories

## Retrospective

### What Worked
- **451 primitives across 10 domains with a DAG dependency graph.** Encoding all 33 chapters of The Space Between as typed primitives with 106 dependency edges makes the knowledge navigable, not just stored. Dijkstra path-finding through mathematical concepts is the right abstraction.
- **Safety-critical tests cover the actual risk surface.** SAFE-04 (5% budget cap), SAFE-05 (zero MFE leakage), SAFE-06 (decompose-compose round trip), SAFE-07 (96.2% duplicate detection), and SAFE-08 (31 attack vectors blocked) each target a specific failure mode of a learning system that modifies itself.
- **sc:learn + sc:unlearn as symmetric operations.** Building reversible sessions with changeset management and graph integrity validation alongside the ingestion pipeline means learning is never a one-way door.
- **STRANGER-tier security on ingestion.** 6 attack categories with 31 blocked vectors on the sc:learn pipeline recognizes that knowledge ingestion is an attack surface -- untrusted input enters the system and modifies its behavior.

### What Could Be Better
- **631 tests for ~9.7K LOC is a high ratio, but test distribution across 16 phases isn't visible.** The release notes list total tests but not per-phase counts (unlike v1.33), making it harder to assess coverage balance.
- **sc:learn supports 8 input formats (PDF, Markdown, docx, txt, epub, zip, tgz, GitHub) but only one has been dogfooded.** The Space Between is the only ingestion target. Format breadth without format depth creates untested paths.

## Lessons Learned

1. **A mathematical knowledge graph needs a dependency DAG, not a flat registry.** 451 primitives without 106 dependency edges would be a glossary. The DAG makes it possible to answer "what do I need to understand before I can understand this?"
2. **Token budget enforcement (2-5% of context window) must be structural, not advisory.** The tiered loading system (4K summary / 15K active / 40K reference) prevents the mathematical foundation from consuming the context window that skill-creator needs for actual work.
3. **Self-modifying systems need reversibility as a first-class feature.** sc:unlearn with session-scoped rollback and skill regeneration after removal is not a nice-to-have -- it's the safety net that makes sc:learn safe to use.
4. **Duplicate detection at 96.2% is honest reporting.** Calling out the gap rather than rounding to "high accuracy" sets the right expectation. The 3.8% gap is a known engineering debt, not a hidden defect.

---
