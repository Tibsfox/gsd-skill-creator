# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-08)

**Core value:** Skills, agents, and teams must match official Claude Code patterns
**Current focus:** Phase 60 in progress — Post-Phase Invocation and Collector Agents

## Current Position

Phase: 60 (ninth of 10 in v1.8) — Post-Phase Invocation and Collector Agents
Plan: 2 of 3 in current phase (60-01, 60-02 complete)
Status: Executing Phase 60
Last activity: 2026-02-08 — Completed 60-02 CollectorAgentGenerator TDD

Progress: [##############░░░░░░] ~60%

## Shipped Milestones

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v1.0 MVP | 1-9 | 29 | Complete | 2026-01-31 |
| v1.1 Validation Enhancements | 10-13 | 13 | Complete | 2026-02-05 |
| v1.2 Skill Quality Assurance | 14-18 | 19 | Complete | 2026-02-05 |
| v1.3 Documentation & Release | 19-23 | 18 | Complete | 2026-02-05 |
| v1.4 Agent Teams Support | 24-29 | 22 | Complete | 2026-02-05 |
| v1.5 Pattern Discovery | 30-35 | 21 | Complete | 2026-02-07 |
| v1.6 Example Skills/Agents/Teams | -- | -- | Complete | 2026-02-07 |
| v1.7 GSD Master Orchestration | 36-51 | 38 | Complete | 2026-02-08 |

**Total shipped:** 51 phases, 174 plans, 80,723 LOC TypeScript + ~10,379 lines documentation

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [v1.8 roadmap]: Pipeline extraction (Phase 52) is prerequisite for all token efficiency — isolate highest-risk refactor
- [v1.8 roadmap]: Budget tiers (Phase 53) must ship before new skill types to prevent 3% budget starvation
- [v1.8 roadmap]: Zero new npm dependencies for entire v1.8 milestone
- [52-01]: Pipeline runner ignores earlyExit -- stages check it themselves
- [52-01]: PipelineContext.context field named 'context' matching apply() parameter
- [52-01]: Context carries DATA, stages hold SERVICES via constructor injection
- [52-01]: Default conflicts match original apply() early-return behavior
- [52-02]: Stages check earlyExit themselves (matching runner design from 52-01)
- [52-02]: getPipeline() public method on SkillApplicator for downstream extensibility
- [52-02]: apply() reduced from 65 to 25 lines via pipeline delegation facade
- [53-01]: Threshold warnings measured against standard budget (not hard ceiling) for actionable percentages
- [53-01]: Critical skills tracked in totalUsed but not standardUsed for independent ceiling space
- [53-01]: Unlisted skills default to standard tier for safe fallback behavior
- [53-02]: BudgetProfile is 4th optional constructor param on SkillApplicator for backward compatibility
- [53-02]: createApplicationContext factory extended with budgetProfile passthrough
- [53-03]: Progress bar measured against hard ceiling, threshold warnings against standard budget
- [53-03]: SkillStore.list()+read() used directly for estimation (no SkillIndex overhead)
- [54-01]: Content hash from raw file content (not parsed objects) for stability
- [54-01]: Sort by scope priority (project first) then alphabetical for determinism
- [54-01]: Whole-manifest contentHash excludes generatedAt timestamp
- [54-03]: show subcommand is default when no args provided for quick status checks
- [54-03]: show reads existing CAPABILITIES.md if present, falls back to in-memory discovery
- [54-03]: generate always overwrites for deterministic idempotent regeneration
- [54-04]: CLI invoked as npx skill-creator capabilities generate (matching package.json bin entry)
- [54-04]: Capability discovery runs after roadmap commit but before completion banner
- [54-04]: CAPABILITIES.md committed via gsd-tools commit pattern matching existing workflow style
- [55-01]: Plain TypeScript types (not Zod) for CapabilityVerb/CapabilityType/CapabilityRef since used in parsing, not schema validation
- [55-01]: parseCapabilityLine kept private, only parseCapabilityDeclarations exported as public API
- [55-01]: Block termination at **metadata** lines, # headings, and 1. numbered lists
- [55-02]: Placeholder-based pipe splitting: replace \| with null-byte placeholder before splitting by |, then restore
- [55-02]: gray-matter Date coercion handled: generatedAt may be parsed as Date object, converted back to ISO string
- [55-02]: Optional fields use dash-to-undefined mapping: '-' in table cells becomes undefined on typed objects
- [55-03]: Create verb always bypasses validation (declares intent, not dependency)
- [55-03]: Set-based O(1) lookups built in constructor for per-reference validation
- [55-03]: ValidationResult.valid derived from warnings.length === 0
- [55-04]: Cast capabilitiesByPhase as ParsedRoadmap type to bridge Zod passthrough and CapabilityRef types
- [55-04]: Omit capabilitiesByPhase from result when no phases have capabilities for backward compatibility
- [55-04]: Planner inheritance rule: missing capabilities field = inherit all from parent phase
- [56-02]: gray-matter stringify for skill templates ensures SkillStore.read() compatibility
- [56-02]: Raw markdown frontmatter for agent templates (simpler, matches parseAgentFile)
- [56-02]: Teams silently skipped from scaffolding (too complex for auto-generation)
- [56-02]: checkExisting uses existsSync for synchronous file detection
- [56-01]: All declared capabilities get critical tier (declared = must-load)
- [56-01]: use/adapt verbs loaded, create/after verbs filtered, team refs filtered
- [56-01]: Token estimation via content.length/4 ceiling matching existing codebase pattern
- [56-03]: SkillInjector and CapabilityScaffolder re-exported from both barrel and package root
- [56-03]: Execute-phase skill injection step inserted as step 3 before agent wait
- [56-03]: Injected skills protocol placed between continuation_handling and tdd_execution in executor
- [57-01]: Name-based mock registry pattern for SkillStore in pipeline stage tests (avoids sequential mock ordering bugs)
- [57-01]: isValidCacheTier type guard validates tier values from untyped frontmatter
- [57-01]: Legacy cacheTier read from metadata root level for backward compatibility
- [57-02]: CacheOrderStage always runs (not conditional on budgetProfile) since cache ordering is valuable regardless of budget
- [57-02]: CacheTier re-exported from both extensions.ts and stages/index.ts for flexible import paths
- [58-02]: generatedFrom accessed via type assertion on extension (formal typing deferred to Plan 03)
- [58-02]: source field checked via Record cast on SkillMetadata (custom field from ResearchCompressor)
- [58-02]: Missing generatedFrom treated as not_auto_generated (safe fallback)
- [60-02]: Raw markdown frontmatter (not gray-matter) matching CapabilityScaffolder agent pattern
- [60-02]: Pure generate() returns content string, no disk write (CLI handles persistence)
- [60-02]: Validation via existing validateAgentFrontmatter for format compliance
- [59-01]: modelGuidance read via type assertion from raw metadata (not added to SkillMetadata interface)
- [59-01]: Unknown model profiles default to sonnet tier (safe middle ground)
- [59-01]: Capability levels: opus=3, sonnet=2, haiku=1 for minimumCapability checks
- [61-01]: Kahn's algorithm for topological wave assignment with file conflict edges
- [61-01]: Conservative default: plans without files_modified get sequential assignment
- [61-01]: Plan ID alphabetical ordering breaks ties deterministically for file conflicts
- [61-01]: Advisory only: recommendations with rationale, never automatic changes
- [58-01]: source: 'auto-generated' placed as custom field on SkillMetadata root (not official Claude Code field)
- [58-01]: generatedFrom details stored in gsd-skill-creator extension namespace
- [58-01]: Priority-based section ranking with configurable sectionPriority list
- [58-01]: Distillation keeps bullets/code/decisions, truncates prose > 3 lines, removes cross-refs and bare URLs
- [58-03]: Manual skill always wins: if existing skill has no source: auto-generated, skip overwrite
- [58-03]: Cast SkillMetadata through unknown for custom source field access (matching staleness-checker pattern)
- [58-03]: Dry-run shows first 1000 chars of compressed output as preview
- [59-02]: Pipeline order: Score -> Resolve -> ModelFilter -> CacheOrder -> Budget -> Load (CacheOrder before Budget)
- [59-02]: ModelFilterStage conditionally inserted only when modelProfile provided (backward compatible)
- [59-02]: modelProfile is 5th optional constructor param on SkillApplicator (after budgetProfile)

### Pending Todos

None.

### Blockers/Concerns

- [Research]: Phase 57 (cache ordering) is novel — may need cache behavior research during planning
- [Research]: Phase 58 (research compression) has novel heuristics — may need compression ratio validation
- [Research]: Phase 59 (model-aware activation) has novel model boundaries — ship advisory-only first

## Quick Tasks

| ID | Name | Status | Commit | Completed |
|----|------|--------|--------|-----------|
| 001 | Add --version flag to CLI | Done | b7a9665 | 2026-02-07 |
| 002 | Fix flaky activation-simulator test | Done | cfaa419 | 2026-02-06 |

## Session Continuity

Last session: 2026-02-08
Stopped at: Completed 60-02-PLAN.md (CollectorAgentGenerator TDD). Next: 60-03.
Resume file: None

## Performance Metrics

| Phase-Plan | Duration | Tasks | Files | Date |
|------------|----------|-------|-------|------|
| 52-01 | 3min | 2 | 2 | 2026-02-08 |
| 52-02 | 5min | 2 | 7 | 2026-02-08 |
| 53-01 | 5min | 2 | 6 | 2026-02-08 |
| 53-02 | 2min | 2 | 3 | 2026-02-08 |
| 53-03 | 4min | 2 | 3 | 2026-02-08 |
| 54-01 | 2min | 2 | 3 | 2026-02-08 |
| 54-03 | 3min | 2 | 5 | 2026-02-08 |
| 54-04 | 2min | 2 | 2 | 2026-02-08 |
| 55-01 | 2min | 2 | 3 | 2026-02-08 |
| 55-02 | 2min | 2 | 2 | 2026-02-08 |
| 55-03 | 1min | 2 | 2 | 2026-02-08 |
| 55-04 | 3min | 2 | 5 | 2026-02-08 |
| 56-02 | 2min | 2 | 2 | 2026-02-08 |
| 56-01 | 2min | 2 | 2 | 2026-02-08 |
| 56-03 | 3min | 2 | 5 | 2026-02-08 |
| 57-01 | 3min | 2 | 2 | 2026-02-08 |
| 58-02 | 1min | 2 | 2 | 2026-02-08 |
| 60-02 | 2min | 2 | 2 | 2026-02-08 |
| 59-01 | 2min | 2 | 4 | 2026-02-08 |
| 58-01 | 3min | 2 | 2 | 2026-02-08 |
| 61-01 | 3min | 2 | 3 | 2026-02-08 |
| 57-02 | 2min | 2 | 4 | 2026-02-08 |
| 58-03 | 3min | 2 | 5 | 2026-02-08 |
| 59-02 | 4min | 2 | 3 | 2026-02-08 |

---
*Updated: 2026-02-08 after 59-02 ModelFilterStage pipeline wiring completed*
