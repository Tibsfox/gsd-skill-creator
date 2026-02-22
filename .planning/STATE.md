# State: v1.30 — Vision-to-Mission Pipeline

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-21)

**Core value:** Skills, agents, and teams must match official Claude Code patterns — and the GSD ecosystem must provide spatial, visual, and operational tools that make complex system design tangible.
**Current focus:** Phase 288 complete — Mission Assembly Integration Wiring

## Current Position

Phase: 288 of 290 (Mission Assembly Integration Wiring) — 10 of 12 in milestone
Plan: 2 of 2 in current phase
Status: 288-02 complete (phase complete)
Last activity: 2026-02-22 — 288-02 complete (test updates for real wave plan, test plan, signal-based model assignment)

Progress: [#########░] 85% (10/12 phases)

## Performance Metrics

**Velocity:**
- Total plans completed: 20
- Average duration: 4min
- Total execution time: 71min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 279 Types & Schemas | 2 | 9min | 4.5min |
| 280 Vision Document Processing | 2 | 7min | 3.5min |
| 281 Research Reference Compilation | 2 | 5min | 2.5min |
| 282 Mission Package Assembly | 2 | 7min | 3.5min |
| 283 Wave Planning | 2 | 7min | 3.5min |
| 284 Model Assignment | 2 | 6min | 3min |
| 285 Cache Optimization | 2 | 10min | 5min |
| 286 Test Plan Generation | 2 | 6min | 3min |
| 287 Template System | 2 | 6min | 3min |
| 288 Mission Assembly Integration | 2 | 8min | 4min |

## Accumulated Context

### Decision Log

- 2026-02-21: v1.30 roadmap created — 11 phases (279-289), 58 requirements, comprehensive depth
- 2026-02-21: Module location: src/vtm/ following existing convention (src/den/, src/agc/, src/amiga/, src/knowledge/)
- 2026-02-21: Existing vision-to-mission skill at .claude/commands/vision-to-mission.md with 7 templates serves as reference implementation
- 2026-02-21: All types inferred from Zod schemas via z.infer — zero manual type duplication
- 2026-02-21: TestSpec IDs use regex /^[SCIE]-\d{3}$/ enforcing categorized pattern at parse time
- 2026-02-21: MissionPackage is top-level aggregate composing all sub-schemas by direct reference
- 2026-02-21: Regex-based section extraction over full markdown AST parser for vision document parsing
- 2026-02-21: ParseResult<T> discriminated union pattern established for all VTM parser returns
- 2026-02-21: Section type preserves original header casing for module name extraction
- 2026-02-21: VisionDiagnostic type with severity/section/message/code for all validation output
- 2026-02-21: Separate validateVisionDocument (structural) from checkQuality (content) for composability
- 2026-02-21: Weighted keyword archetype classification: name 3x, module names 3x, vision 2x, coreConcept 2x
- 2026-02-21: Archetype-based source organizations: professional orgs auto-selected by classifyArchetype result
- 2026-02-21: Safety boundary inference: gate for danger/hazard/lethal/fatal, annotate for caution/warning/risk, annotate as default
- 2026-02-21: SourceDiagnostic mirrors VisionDiagnostic pattern for consistency
- 2026-02-21: Token estimation via Math.ceil(content.length / 4) standard char-to-token approximation
- 2026-02-21: Safety always forces full research speed regardless of archetype
- 2026-02-21: 5+ modules forces full research regardless of archetype (scope threshold)
- 2026-02-21: Self-containment validator pattern ordering: import > @file > cross-file-link > file-path (specificity first)
- 2026-02-21: Wave assignment via topological sort with cyclic dependency fallback
- 2026-02-21: Model assignment heuristic: opus for safety, haiku for single-concept, sonnet default
- 2026-02-21: First-match-wins per text source in self-containment validator avoids duplicate diagnostics
- 2026-02-21: Model split percentages computed as count/total*100 rounded to 1 decimal
- 2026-02-21: Placeholder wave plan uses single wave with task-NNN IDs (replaced by Phase 283)
- 2026-02-21: Placeholder test plan uses C-NNN core tests per criterion (replaced by Phase 286)
- 2026-02-21: MissionPackage status is 'draft' when wave plan and test plan are placeholders
- 2026-02-21: Greedy graph coloring for parallel track detection -- O(n^2) conflict + O(n) coloring
- 2026-02-21: Wave 0 enforcement via keyword matching on objective + produces (types/interfaces/schema/config)
- 2026-02-21: Critical path computed by tracing longest dependency chain from leaf specs to roots
- 2026-02-21: Task ID from sanitized spec name (task-spec-name) rather than numeric task-NNN
- 2026-02-21: Exact task ID suffix matching to avoid false positives on short spec names
- 2026-02-21: Token-to-time conversion at 1000 tokens/min for human-readable formatting
- 2026-02-21: Interface mismatch risk requires 2+ wave gap between producer and consumer
- 2026-02-21: Critical path parsed from plan string and matched to task IDs for asterisk marking
- 2026-02-21: Confidence threshold 0.4 for low-confidence model assignment flagging
- 2026-02-21: Tie-breaking resolves to higher tier: opus > sonnet > haiku
- 2026-02-21: File pattern boost +2 per matching file (test->sonnet, config->haiku, safety->opus)
- 2026-02-21: All-zero signal scores default to sonnet with lowConfidence: true
- 2026-02-21: Deep freeze on SIGNAL_REGISTRY prevents accidental mutation
- 2026-02-21: Downgrade-only rebalancing strategy per user decision: opus->sonnet->haiku, never upgrade
- 2026-02-21: Haiku-over violations are unresolvable with downgrade-only, returns warning
- 2026-02-21: Iterative violation resolution tries all violations in priority order before giving up
- 2026-02-21: Stable sort tiebreaker by original array index for equal-token-size determinism
- 2026-02-22: gpt-tokenizer encode for accurate token counting (not char/4 heuristic)
- 2026-02-22: Jaccard similarity on significant words (>3 chars, no stopwords) at >50% threshold for content overlap
- 2026-02-22: Multi-strategy spec-to-task matching: sanitized name, produces artifact, word overlap
- 2026-02-22: cacheOptimization.schemaReuse as primary source with produces/dependsOn fallback
- 2026-02-22: Cumulative timing staleness: cache age = sum of wave times from producer to consumer
- 2026-02-22: TTL violations only created when actual dependent consumers exist in the consumer wave
- 2026-02-22: generateCacheReport composes all 6 analyzers into structured CacheReport with recommendations
- 2026-02-22: Recommendations auto-generated for schema reuse, TTL violations, and tier downgrades
- 2026-02-22: Deep freeze on DEFAULT_GENERATOR_CONFIG prevents accidental mutation, matching SIGNAL_REGISTRY pattern
- 2026-02-22: nonSafetyOverrides checked before safetyOverrides in override logic for predictable downgrade behavior
- 2026-02-22: Safety-critical criteria get safetyDensityMin (3) tests, others get densityRange.min (2) tests
- 2026-02-22: Categories array always has exactly 4 entries even when count is 0 for deterministic output shape
- 2026-02-22: coveragePercent reflects only originally mapped criteria (stubs not counted as coverage)
- 2026-02-22: Stub ID generation starts from max existing core ID to avoid collisions
- 2026-02-22: Safety-critical determination for density uses per-test category check (any test with safety-critical triggers elevated threshold)
- 2026-02-22: SAFETY_DENSITY_LOW uses plan.safetyCriticalCount / plan.totalTests for global safety percentage
- 2026-02-22: Mustache {{name}} syntax for template placeholders — zero conflicts with markdown or TypeScript template literals
- 2026-02-22: Module-level Map cache for templates keyed by resolved absolute path
- 2026-02-22: Factory function createTemplateRegistry() following existing VTM functional patterns
- 2026-02-22: wave-plan maps to wave-execution-plan-template.md on disk via explicit filename map
- 2026-02-22: Custom templates override built-in templates of same name via register()
- 2026-02-22: TEMPLATE_SCHEMA_MAP maps all 7 template names to Zod schemas, readme maps to null (freeform markdown)
- 2026-02-22: Warnings (unresolved placeholders, block tokens) do not affect validity -- valid: true when only warnings present
- 2026-02-22: Block tokens ({{#if}}, {{#each}}, etc.) detected as warnings alongside simple placeholders
- 2026-02-22: Line numbers for unresolved tokens computed by counting newlines before match position (1-based)
- 2026-02-22: Adapter function assignModelForModule bridges module interface to AssignmentInput for signal-based classifier
- 2026-02-22: Kept MissionPackage status as draft since schema only allows ready/draft/in-progress
- 2026-02-22: Haiku task test replaced with sonnet-default: signal-based classifier requires scaffold/boilerplate keywords, not just low concept count
- 2026-02-22: Test flexibility pattern: assert structural invariants (regex, range) over exact values for classifier-dependent output

### Key Constraints

- Must follow existing project patterns: Zod schemas, functional API + class wrapper, TDD
- Phase 279 (types) is foundation — all other phases depend on it
- Phases 284 (model), 286 (test plan), 287 (template) depend only on 279, enabling parallelization
- Phase 288 (pipeline orchestrator) depends on all feature phases (280-287)

### Blockers

None.

## Session Continuity

Last session: 2026-02-22
Stopped at: Completed 288-02-PLAN.md (Phase 288 complete)
Resume file: None
