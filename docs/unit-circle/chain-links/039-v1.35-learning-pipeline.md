# Chain Link: v1.35 Learning Pipeline + Mathematical Foundations Engine

**Chain position:** 39 of 50
**Milestone:** v1.50.52
**Type:** REVIEW — v1.35
**Score:** 4.50/5.0

---

## Score Trend

```
Pos  Ver    Score  Δ      Commits  Files
 32  BUILD  4.50   +0.12        4    12
 33  v1.29  4.44   -0.06       89   121
 34  v1.30  4.50   +0.06       51    35
 35  v1.31  4.41   -0.09       31   103
 36  v1.32  4.53   +0.12       46    64
 37  v1.33  4.28   -0.25       64   138
 38  v1.34  3.94   -0.34       16   124
 39  v1.35  4.50   +0.56       81   107
rolling: 4.388 | chain: 4.269 | floor: 3.32 | ceiling: 4.55
```

## What Was Built

v1.35 delivers two major subsystems across 81 commits, 107 files changed, +45,795/-459 lines — the largest version by line count in the chain. The work spans 16 plans (335–350), organized into two tracks: the Mathematical Foundations Engine (MFE) providing a structured mathematical knowledge base with 451 primitives across 10 domains, and a complete learning pipeline (`sc:learn`, `sc:unlearn`) that ingests, validates, merges, and generates skills from external mathematical content.

**MFE Type System & Data (Plans 335–338, 25 commits):**
- **16-type system (f3cbb1e4):** `MathematicalPrimitive` with `PlanePosition`, `DependencyEdge`, `CompositionRule`, `DomainDefinition`, `ProblemAnalysis`, `CompositionPath`, `CompositionStep`, `MFEObservation`, `RegistrySummary`. Each primitive carries formal statement, computational form, prerequisites, graph edges, activation patterns, and build lab references. The type system is the foundation — every downstream component depends on it.
- **JSON schema (637c2896):** 245-line schema at `schemas/primitive-registry.schema.json` for validating domain JSON files. Registry validator (d4afbd67) uses `ajv` with JSON Schema 2020-12 for compile-time validation.
- **10 domain extractions (336–338):** 451 primitives extracted from 33 chapters of "The Space Between" across Perception (43), Waves (50), Change (58), Structure (51), Reality (44), Foundations (55), Mapping (42), Unification (37), Emergence (36), Synthesis (35). Each primitive has a precise `formalStatement` — not placeholder text. Perception's "Natural Numbers" carries the Peano axioms; "Real Line Completeness" has the least upper bound property.
- **3-tier dependency wiring (336–338):** foundational.json (361 lines), intermediate.json (670 lines), advanced.json (691 lines). Cross-domain dependencies connect Perception→Waves→Change→Structure and beyond. One fix commit (f55c9972) added 22 primitives and corrected 71 invalid dependency references — the only fix in the milestone.
- **Domain index (ccb7ca26):** 178-line `data/domain-index.json` mapping each domain to its chapters, plane region, activation patterns, and compatible domains.

**MFE Graph & Composition Engines (Plans 339–342, 16 commits):**
- **Dependency graph engine (39057c2f):** DAG construction with topological sort, cycle detection, and path finding. 335 lines.
- **Weighted path finder (f3fe161f):** Dijkstra implementation for finding optimal composition paths between primitives across domains. 346 lines.
- **Plane classifier (3dc8cec9):** Maps problems to complex plane positions and activates relevant domains with confidence scoring. 223 lines.
- **Plane navigator (ba41ed9a):** Domain routing with decomposition strategies — routes problems through domain combinations based on plane position. 352 lines.
- **Composition engine (e8aa464f):** Chain discovery that composes primitives into multi-step solutions with dimensional consistency. 389 lines.
- **Proof composer (b5da0842):** Generates formal reasoning chains with justification at each step. 295 lines.
- **Verification engine (4e4d5e19):** SAFE-03 safety-critical layer checking dimensional consistency, type compatibility, and domain validity. Every function wraps in try/catch, never returns undefined/null. 299 lines.
- **Property checkers (7db3ecb8):** 5 validators for mathematical properties (commutativity, associativity, distributivity, identity, invertibility). 426 lines.

**MFE Integration Layer (Plans 343–344, 9 commits):**
- **MFE skill type (c6a707c1):** Detection, scoring, and tiered knowledge metadata for skill-creator integration. 159 lines.
- **Pipeline hooks (88f547b5):** Score and Budget stage integration points. 195 lines.
- **Domain skill generator (98c57d9f + 679c6b0e):** Generates 10 progressive-disclosure SKILL.md files at `skills/mfe-domains/`. Each skill provides summary, key primitives with formal statements and applicability patterns, activation triggers, and read-only tool access.
- **Observation feed (62fa6712):** JSONL-persistent observation recording for MFE usage patterns. 204 lines.
- **Pattern refiner (08d504b5):** Refines MFE patterns from observations with changeset output. 172 lines.
- **Path cache (94f15be2):** LRU cache for composition paths. 164 lines.

**MFE Integration Tests (Plan 345, 4 commits):**
- **Pipeline tests (ee0f74be):** 633 lines testing all 10 domains through the full classify→navigate→compose→verify pipeline.
- **Euclid's Test (cc7ecbe4):** 636-line SAFE-06 proof — 9 hand-crafted primitives across 3 domains (Perception, Change, Structure) proving that decompose→compose round trip preserves mathematical validity. Named after Euclid's foundational principle that complex mathematics reduces to building blocks.
- **Magic Test (db326f76):** 694-line SAFE-05 proof — ensures no MFE internal representations leak into user-facing output. Tests that primitive IDs, plane positions, and internal metadata are invisible to end users.

**Learning Pipeline (Plans 346–348, 18 commits):**
- **Source acquirer (94cdda3d):** Multi-format input (local files, URLs, GitHub repos, archives). 486 lines. Determines `SourceFamiliarity` (HOME vs STRANGER) for downstream security decisions.
- **Sanitization pipeline (6bf6a300):** STRANGER-tier hygiene with prompt injection detection, hidden Unicode scanning, path traversal blocking, embedded code detection. 440 lines. The security boundary for external content.
- **HITL gate (3003adf8):** Human-In-The-Loop approval with Three Laws — STRANGER content never auto-approved, clean HOME content auto-approves silently, HOME with findings requires review. Injectable `PromptFn` for testability. 151 lines.
- **Document analyzer (954363c0):** Content structure analysis for extraction planning. 498 lines.
- **General extraction heuristic (16f9c3f6):** Base heuristic for primitive extraction from analyzed documents. 537 lines.
- **Dependency wirer (26e1ccd0):** Connects extracted primitives to the existing dependency graph. 233 lines.
- **Extraction heuristic library (4caf1625):** 5 specialized heuristics — code, math, paper, spec, tutorial. Each heuristic produces `CandidatePrimitive` arrays tailored to the source type.
- **Dedup pre-filter (326964ed):** Proximity and keyword matching to identify likely duplicates before expensive semantic comparison. 111 lines.
- **Semantic comparator (77d4c876):** 5-class classification (exact-duplicate, generalization, specialization, overlapping-distinct, genuinely-new) using Jaccard similarity on formal statements, computational forms, and keywords. 282 lines.
- **Merge engine (954ed6a3):** Conflict resolution with provenance tracking. Critical safety invariant: `merge()` NEVER produces a 'replace' action — only `resolveConflict()` can, and only after explicit user decision. Enforces LEARN-08: never silently overwrites. 367 lines.
- **Changeset manager (0ff687bb):** Session-tracked reversible operations with graph integrity validation. Revert checks for dangling references before executing — blocked unless `force=true`. 240 lines.

**Generators & CLI (Plan 349, 5 commits):**
- **Skill generator (10bf79b9):** Produces learned skill files with threshold-based activation and progressive disclosure tiers. 281 lines.
- **Agent generator (1efda4ac):** Creates agents from learned primitives using distance and quadrant thresholds for scope definition. 268 lines.
- **Team generator (1efda4ac):** Generates team configurations from primitive clusters. 320 lines.
- **sc:learn CLI (efbd3aa4):** Top-level orchestrator tying all 10 pipeline stages into a single command — acquire → sanitize → HITL → analyze → extract → wire → dedup → compare → merge → generate → report. 358 lines with progress callbacks and error accumulation.
- **sc:unlearn CLI (c4e6370d):** 5-stage revert flow — LOAD → VALIDATE → PROCESS → REGENERATE → SUMMARY. Loads session changeset, validates revert safety, processes reversals, regenerates affected skill files. 195 lines.

**Learning report generator (b628c655):** Generates provenance reports documenting exactly what was learned, from where, through which merge decisions. 341 lines.

**Security Tests (Plan 350, 2 commits):**
- **Self-validation test (586b0673):** SAFE-07 integration test — verifies the MFE pipeline validates its own output. 262 lines.
- **Security stress test (8b41fba1):** SAFE-08 proof — 9 attack vector groups (prompt injection, hidden Unicode, path traversal, embedded code, oversized/binary, multi-vector, HITL blocking, false-positive safety, E2E pipeline fence). 472 lines of deliberate poisoned-document testing.

## Commit Summary

- **Total:** 81 commits
- **feat:** 48 (59.3%)
- **test:** 29 (35.8%)
- **fix:** 1 (1.2%)
- **refactor:** 1 (1.2%)
- **docs:** 1 (1.2%)
- **chore:** 1 (1.2%)

1.2% fix rate — the lowest in the review chain and a dramatic recovery from v1.34's 25%. TDD discipline is strong: 29 test commits consistently precede their corresponding feat commits within plan scopes, with interleaving across plans reflecting wave-based parallel execution. Plan 349 (generators) has slightly weaker TDD separation — generator test files are committed within feat commits rather than in separate test-first commits.

## Scoring

| Dimension | Score | Notes |
|-----------|-------|-------|
| Code Quality | 4.5 | Consistent patterns across 107 files. Safety invariants are documented and enforced: merge engine's "NEVER produces replace" contract, verification engine's "every function wraps in try/catch, never returns undefined/null," changeset manager's "revert checks integrity BEFORE executing." Dependency injection throughout (PromptFn, GraphIntegrityValidator, VerificationLookups) enables testing without mocks of the injected interfaces. The one fix commit (71 invalid dependency refs) is a data quality issue rather than a code quality issue — the 451 primitives across 10 domains with 3 tiers of cross-domain dependencies are genuinely complex to wire correctly. Jaccard similarity in the semantic comparator is simple and appropriate — no over-engineering. |
| Architecture | 4.5 | Clean separation into four tiers: types (mfe-types.ts) → data (domains/*.json) → engines (src/engines/) → integration (src/integration/) → pipeline (src/learn/) → CLI (src/commands/). The 16-type system at the foundation is well-designed: `PlanePosition` maps problems to the complex plane, `MathematicalPrimitive` carries both formal and computational content, `CompositionPath` tracks multi-step solutions with verification status per step. The learning pipeline's 11-stage architecture (acquire→sanitize→HITL→analyze→extract→wire→dedup→compare→merge→generate→report) has clear data flow — each stage produces a typed result consumed by the next. Two subsystems (MFE + learning pipeline) are designed independently but integrated cleanly through the MFE type system. |
| Testing | 4.5 | 36% test commits — the highest test ratio in the review chain for a milestone this large. Strict TDD ordering within plans (test before feat), with minor weakness in plan 349 generators. Named integration proofs elevate testing from mechanical coverage to mathematical demonstration: Euclid's Test (decompose-compose round trip across 3 domains), Magic Test (no internal leakage). Security stress test with 9 attack vectors is the most thorough security testing in the chain. Self-validation test proves pipeline validates its own output. Minor deduction: plan 343 (MFE integration) has no dedicated test commits — testing deferred to plan 345 integration tests. |
| Documentation | 4.5 | Every source file opens with a module-level comment explaining purpose, safety invariants, and relationship to the architecture. Named safety requirements throughout (SAFE-03, SAFE-05, SAFE-06, SAFE-07, SAFE-08, LEARN-08) create a traceable requirements framework. Progressive disclosure SKILL.md files generated for all 10 domains — each provides summary, key primitives with formal statements, activation triggers. The formal statements in domain data files are mathematically precise, not placeholder text. The v1.34 LLIS retrospective (docs/meta/lessons-learned-v1.34.md) demonstrates continuous improvement methodology. |
| Integration | 4.5 | MFE types flow cleanly through all layers: types → data → engines → integration → pipeline → CLI. The sc:learn pipeline consumes all MFE components in a single orchestrated flow. Observation feed creates a feedback loop (observe → refine → cache) for pattern improvement. Domain skill files bridge the MFE engine to the skill-creator ecosystem. The changeset manager connects learning sessions to unlearning sessions with session-tracked provenance. The 71-ref fix commit (f55c9972) reveals the complexity of cross-domain dependency wiring — connections between 451 primitives across 10 domains inevitably require iteration. |
| Patterns | 4.5 | **P11 RECOVERED:** 1 fix / 81 commits = 1.2%, reversing v1.34's 25% fix rate — the strongest P11 showing in the review chain for a milestone of this scale. **P6 EXCEPTIONAL:** The sc:learn 11-stage pipeline is the deepest composition chain in the entire chain. The MFE engine pipeline (classify→navigate→decompose→compose→verify→prove) adds a second 6-stage composition chain. Both operate with typed interfaces between stages. **P14 STRONG:** Type-level interface control between all pipeline components — VerificationLookups, PropertyLookups, GraphIntegrityValidator, PromptFn. **P8 MAINTAINED:** Each pipeline stage is an independent unit with clear input/output contracts. |
| Security | 5.0 | Five named SAFE requirements implemented and proven: SAFE-03 (verification engine safety), SAFE-05 (no MFE leakage — Magic Test), SAFE-06 (decompose-compose integrity — Euclid's Test), SAFE-07 (self-validation), SAFE-08 (poisoned document resistance — 9 attack vectors). The HITL Three Laws pattern (STRANGER never auto-approved, clean HOME auto-approves, HOME with findings requires review) is a well-designed security boundary. Sanitization pipeline handles prompt injection, hidden Unicode, path traversal, embedded code, oversized/binary content. Merge engine's "never silently overwrites" invariant (LEARN-08) prevents data loss. This is the most comprehensive security coverage in the chain. |
| Connections | 4.5 | v1.34 LLIS retrospective maps lessons forward into v1.35 design. The +0.56 delta (largest positive delta in the review chain) directly addresses v1.34's P11 regression. The MFE data is extracted from "The Space Between" — 33 chapters mapped to 10 domains, grounding the mathematical framework in a specific source text. The learning pipeline connects the MFE knowledge base to the skill-creator ecosystem — primitives flow from data files through engines to generated skills, agents, and teams. The changeset/unlearn system provides the first reversibility guarantee in the chain, creating a safety net for knowledge modifications. |

**Overall: 4.50/5.0** | Delta: +0.56 from position 38

## Pattern Assessment

| Pattern | Status | Evidence |
|---------|--------|----------|
| P1: CSS/style | N/A | No CSS changes in this milestone |
| P2: Import patterns | STABLE | Consistent `.js` extensions throughout new files |
| P3: safe* wrappers | STABLE | Verification engine wraps all functions in try/catch, never returns undefined/null |
| P4: Copy-paste | STABLE | Pipeline stages follow consistent factory/interface patterns without copy-paste |
| P5: Never-throw | STRONG | Verification engine SAFE-03 guarantee. Changeset manager returns structured errors instead of throwing. Merge engine returns conflict objects instead of throwing on duplicates. |
| P6: Composition | EXCEPTIONAL | Two deep pipelines: sc:learn (11 stages) and MFE engine (6 stages). Deepest P6 in the chain. Each stage has typed input/output contracts. |
| P7: Docs-transcribe | STABLE | Module-level docs on all files. Domain SKILL.md generation from data. |
| P8: Unit-only | STRONG | Each pipeline stage is independently testable with injected dependencies. No stage depends on global state. |
| P9: Scoring duplication | STABLE | New scoring formulas (Jaccard similarity, domain activation scoring, confidence values) are purpose-built and non-duplicative. Each serves a distinct function in the pipeline. |
| P10: Template-driven | STABLE | Domain skill files generated from template with consistent progressive disclosure format. |
| P11: Forward-only | RECOVERED | 1/81 = 1.2% fix rate. Single fix was data quality (71 invalid dependency refs), not code quality. Strongest P11 in the chain at this scale. |
| P12: Pipeline gaps | STABLE | Full pipeline from source acquisition to skill generation is complete and tested end-to-end. No gaps between stages. |
| P13: State-adaptive | N/A | No state-adaptive routing in this milestone |
| P14: ICD | STRONG | VerificationLookups, PropertyLookups, GraphIntegrityValidator, PromptFn — all serve as interface control documents between subsystems. MFE type system is a 171-line ICD for the entire engine stack. |

## Feed-Forward

- **FF-19:** The MFE's 451 primitives with 3-tier cross-domain dependencies create a genuine mathematical knowledge graph. Future milestones should test this graph under real problem-solving — does the plane classifier route problems to the right domains? Does the composition engine find valid multi-domain solutions? The integration tests prove the machinery works; runtime usage will reveal whether the data is rich enough. The 71 invalid dependency refs in the fix commit suggest dependency wiring at this scale needs automated validation tooling beyond schema checking.
- **FF-20:** The sc:learn/sc:unlearn pipeline establishes a pattern for knowledge ingestion with reversibility. The HITL Three Laws (STRANGER never auto-approved, clean HOME auto-approves, HOME with findings requires review) and the merge engine's "never silently overwrites" invariant are security patterns that should be applied to any future content ingestion pipeline. The changeset manager's graph integrity check before revert is a model for safe undo operations.
- **FF-21:** Named mathematical proofs (Euclid's Test, Magic Test) elevate testing from coverage metrics to mathematical demonstration. Each test is named for the principle it proves, carries a clear thesis, and validates a specific safety requirement. This naming convention makes tests self-documenting and communicates intent to future readers. Future test suites should adopt this pattern for integration tests that prove system properties rather than exercise code paths.
- **FF-22:** The 11-stage sc:learn pipeline is the deepest composition chain in the project. Each stage has typed input/output contracts, making the pipeline extensible — new heuristics, new comparison strategies, new generators can be added without modifying the orchestrator. This "pipeline of typed transforms" pattern is the mature expression of P6 and should inform future pipeline designs.

## Key Observations

**v1.35 is the largest and most architecturally ambitious version in the chain.** 45,795 lines added across 107 files, delivering two complete subsystems that work together. The MFE provides a structured mathematical knowledge base (451 primitives, 10 domains, 3-tier dependencies, 8 engine components). The learning pipeline provides an 11-stage ingestion system with security boundaries, human approval gates, semantic deduplication, conflict resolution, and reversible operations. Neither subsystem is trivial or scaffolding — both are fully implemented with comprehensive tests.

**The P11 recovery is the defining quality signal.** v1.34 had 4 fix commits in 16 (25% fix rate), the worst in the chain. v1.35 has 1 fix in 81 (1.2%), and that fix addresses data quality (71 invalid dependency references in 451 primitives) rather than code bugs. This reversal was achieved at 5x the scale of v1.34 — 81 commits vs 16. The fix commit itself reveals that wiring cross-domain dependencies across 451 primitives is genuinely complex (71 invalid refs is ~15% of the total), but the correction was contained to a single commit early in the data pipeline before downstream engines consumed the data.

**The security coverage is the most comprehensive in the chain.** Five named SAFE requirements (SAFE-03 through SAFE-08), each with a dedicated test proving compliance. The security stress test doesn't just check that bad input is rejected — it constructs 9 categories of deliberately poisoned documents (prompt injection, hidden Unicode, path traversal, embedded code, oversized/binary, multi-vector, HITL blocking, false-positive safety, E2E pipeline fence) and proves they cannot reach the registry. The HITL Three Laws pattern and the merge engine's "never silently overwrites" invariant create defense-in-depth for knowledge integrity.

**TDD discipline holds at scale with minor exceptions.** 29 test commits (36%) consistently precede their corresponding feat commits within plan scopes. The wave-based parallel execution interleaves test commits across plans (test(346-01) and test(347-01) appear in the same commit sequence) but within each plan's scope, the test→feat ordering is maintained. Plan 349 (generators) has slightly weaker separation — test files are committed within feat commits rather than in dedicated test-first commits. Plan 343 (MFE integration) defers testing to plan 345's integration tests, which is a reasonable architectural decision for glue code.

**The mathematical primitives are substantive, not superficial.** Perception's "Natural Numbers" carries the Peano axioms with a precise formal statement. "Real Line Completeness" has the least upper bound property. Cross-domain dependencies are semantically meaningful — perception-natural-numbers enables waves-harmonic-series and waves-fundamental-frequency. The plane positions place each primitive on the complex plane (logic/creativity × embodied/abstract), enabling the plane classifier to route problems to relevant domains. This is a genuine knowledge representation, not a taxonomy with placeholder descriptions.

## Reflection

v1.35 scores 4.50 — a +0.56 delta from position 38, the largest positive delta in the review chain. The rolling average recovers to 4.388 (from 4.248) and the chain average increases to 4.269 (from 4.263). This score ties with positions 32 (Hypervisor BUILD) and 34 (v1.30 VTM Pipeline), placing it among the top-scoring milestones in the chain, just below v1.32's ceiling of 4.53 and the BUILD-milestone ceiling of 4.55.

The +0.56 delta is earned through three factors. First, P11 recovery: dropping from 25% fix rate to 1.2% while simultaneously scaling from 16 commits to 81. This is the strongest evidence in the chain that P11 is controllable — the v1.34 regression was a data point, not a trend. Second, P6 depth: the 11-stage sc:learn pipeline and 6-stage MFE engine pipeline are the deepest composition chains in the project, with typed interfaces between every stage. This is P6 operating at its strongest. Third, security rigor: 5 named SAFE requirements each proven by dedicated tests, with the security stress test's 9 attack vector groups providing defense-in-depth verification.

The 0.05 gap between this score (4.50) and the ceiling (4.55) reflects two minor weaknesses. Plan 349's TDD separation is slightly loose — generator tests bundled with feat commits rather than in dedicated test-first commits. And the 71 invalid dependency refs, while corrected in a single fix commit, reveal that cross-domain data wiring at the 451-primitive scale exceeds what manual verification can reliably catch — automated graph validation during data extraction would prevent this class of error.

The chain now shows a V-shaped recovery: 4.53 → 4.28 → 3.94 → 4.50. The v1.34 trough at 3.94 was a maintenance-heavy milestone paying down build debt. v1.35 returns to construction with the largest, most ambitious build in the chain. The question for position 40 is whether this quality level sustains at scale or whether the next milestone will show fatigue effects from 45K lines of new code.
