# GSD Skill Creator

## What This Is

A skill, agent, and team management tool for Claude Code that creates, validates, maintains, discovers, and orchestrates skills, agents, and teams. Features comprehensive validation (schema, conflicts, activation likelihood), activation testing (test cases, simulation, calibration), team scaffolding from orchestration patterns, team-aware validation, session log pattern discovery with semantic clustering, a master orchestrator with intent classification, lifecycle coordination, and Gas Town-inspired platform features (work state, session continuity, workflows, roles, bundles, events), and capability-aware planning with token efficiency optimizations (pipeline architecture, token budgets, cache ordering, research compression, model-aware activation, collector agents, parallelization analysis).

## Core Value

Skills, agents, and teams must match official Claude Code patterns so they work correctly when loaded by Claude Code.

## Current Milestone: None (v1.8 shipped, next TBD)

## Current State

**Shipped:** v1.8 Capability-Aware Planning + Token Efficiency (2026-02-09)
**Codebase:** 90,447 LOC TypeScript across 550+ files + ~10,379 lines documentation
**Test coverage:** 800+ tests (embeddings, conflicts, activation, testing, calibration, teams, discovery, orchestrator, workflows, roles, bundles, events, pipeline, budgets, capabilities, cache, compression, model-filter, invoker, collector, parallelization)

**Complete feature set:**
- Skill/agent creation with official Claude Code format compliance
- Comprehensive validation: schema, conflicts, activation likelihood, budget, description quality
- Activation testing: test cases, simulation engine, execution framework, auto-generation, calibration
- Team scaffolding: leader/worker, pipeline, swarm patterns with TeamStore persistence
- Team validation: 7 validators (schema, semantic, topology, agent resolution, cycles, tool overlap, skill conflicts + role coherence)
- Team CLI: 5 commands (create, list, validate, spawn, status) under team/tm namespace
- GSD team templates: parallel research (5 members) and adversarial debugging (4 members)
- Pattern discovery: session log scanning, tool sequence n-grams, Bash pattern classification, DBSCAN clustering
- Discover CLI: single command with incremental scanning, progress output, draft skill generation
- Master orchestrator: dynamic discovery, intent classification (Bayes + embeddings), lifecycle coordination
- Orchestrator agent: two-layer .md file (Layer 1 standalone, Layer 2 enhanced by skill-creator)
- Verbosity controller (5 levels) and HITL gate framework
- Persistent work state with session hooks (auto-save/restore)
- Session continuity via narrative snapshots with skill pre-loading suggestions
- Ephemeral observations with tiered promotion to persistent storage
- Skill workflows: DAG-based multi-step chains with crash recovery
- Skill roles: behavioral constraints with tool scoping and additive composition
- Work bundles: project-phase skill sets with progress tracking and auto-suggestion
- Inter-skill communication: event emit/listen system with co-activation-based suggestion
- Documentation: CLI reference (40+ commands), API reference (60+ exports), architecture, tutorials
- SkillPipeline: composable pipeline with pluggable stages (Score, Resolve, Load, Budget, CacheOrder, ModelFilter)
- Token budgets: per-agent profiles with critical/standard/optional priority tiers and budget-estimate CLI
- Capability manifest: auto-generated CAPABILITIES.md with dual-scope discovery
- Phase capability declarations: use/create/after/adapt verbs with plan inheritance and validation
- Skill injection: auto-inject skills into executor context based on plan capabilities
- Capability scaffolding: create-verb generates plan tasks for new skills/agents
- Cache-aware ordering: cacheTier (static/session/dynamic) sort within relevance bands
- Research compression: 10-20x reduction with staleness detection and manual-wins conflict resolution
- Model-aware activation: modelGuidance metadata with graceful skip on mismatch
- Post-phase invocation: after-verb auto-triggers capabilities on phase verification pass
- Collector agents: auto-generated read-only agents for context-efficient gathering
- Parallelization advisor: wave-based parallel execution recommendations from plan dependency analysis

## Requirements

### Validated

- ✓ Skill frontmatter uses only official fields at root level — v1.0
- ✓ Custom fields namespaced under metadata.extensions.gsd-skill-creator — v1.0
- ✓ Directory structure verified as skill-name/SKILL.md — v1.0
- ✓ Generated skills pass official schema validation — v1.0
- ✓ Reserved name validation prevents naming conflicts — v1.0
- ✓ Character budget warnings (15k single, 15.5k cumulative) — v1.0
- ✓ Description quality validation for auto-activation — v1.0
- ✓ User-level skill management (~/.claude/skills/) — v1.0
- ✓ Scope precedence documented (project > user) — v1.0
- ✓ Agent tools field uses comma-separated string format — v1.0
- ✓ Agent YAML validation and migration support — v1.0
- ✓ Official vs custom features clearly documented — v1.0
- ✓ Migration guides for legacy skills and agents — v1.0
- ✓ Semantic conflict detection with configurable threshold — v1.1
- ✓ Heuristic activation likelihood scoring (0-100) — v1.1
- ✓ Optional LLM-based deep activation analysis — v1.1
- ✓ Local embeddings via HuggingFace transformers — v1.1
- ✓ Embedding cache with content-hash invalidation — v1.1
- ✓ Graceful degradation to heuristics when model unavailable — v1.1
- ✓ Test case definition and storage for skills — v1.2
- ✓ Activation simulation using embeddings — v1.2
- ✓ Test runner with accuracy/FP rate reporting — v1.2
- ✓ Auto-generation of test cases (heuristic, cross-skill, LLM) — v1.2
- ✓ Calibration against real Claude behavior — v1.2
- ✓ CLI commands fully documented with usage examples — v1.3
- ✓ API/programmatic usage guide for library consumers — v1.3
- ✓ Architecture documentation for contributors — v1.3
- ✓ README reflects all v1.0-v1.2 capabilities — v1.3
- ✓ CHANGELOG complete through v1.2 — v1.3
- ✓ Getting started hub with quickstart and tutorials — v1.3
- ✓ 4 example skills demonstrating best practices — v1.3
- ✓ Team config scaffolding from orchestration pattern templates — v1.4
- ✓ Team-aware cross-member conflict detection — v1.4
- ✓ Team role coherence validation — v1.4
- ✓ Full team lifecycle CLI (create, list, validate, spawn, status) — v1.4
- ✓ Team Zod schemas with .passthrough() forward compatibility — v1.4
- ✓ GSD pre-built team templates (parallel research, adversarial debugging) — v1.4
- ✓ Team documentation (CLI, API, architecture, tutorial, comparison guide) — v1.4
- ✓ Stream-parse JSONL session logs for recurring interaction patterns — v1.5
- ✓ Mine user prompts and assistant tool_use sequences for skill candidates — v1.5
- ✓ Incremental session scanning with watermark-based change detection — v1.5
- ✓ All projects scanned by default, with exclude list — v1.5
- ✓ Multi-factor ranked pattern candidates with evidence from sessions — v1.5
- ✓ Draft SKILL.md generation from selected patterns — v1.5
- ✓ Stream-parse large files (23MB+ sessions) without memory issues — v1.5
- ✓ Discover CLI command with inline progress output — v1.5
- ✓ DBSCAN semantic clustering of user prompts with epsilon auto-tuning — v1.5
- ✓ Dynamic discovery of installed GSD commands/agents/teams from filesystem — v1.7
- ✓ Intent classification mapping user requests to GSD commands — v1.7
- ✓ Lifecycle coordinator automating GSD workflow transitions — v1.7
- ✓ Verbosity controller (5 levels of output detail) — v1.7
- ✓ HITL gate framework for systematic approval/decision points — v1.7
- ✓ Extension awareness (detect gsd-skill-creator if present, offer custom creation) — v1.7
- ✓ Persistent work state across session restarts (task, skills, checkpoint) — v1.7
- ✓ Session continuity via narrative snapshots (summary, files, questions) — v1.7
- ✓ Ephemeral observations with tiered promotion to persistent storage — v1.7
- ✓ Skill workflows with dependency chains and crash recovery — v1.7
- ✓ Skill roles with behavioral constraints for agent personas — v1.7
- ✓ Work bundles grouping skills by project phase with progress tracking — v1.7
- ✓ Inter-skill communication via events (emit/listen patterns) — v1.7
- ✓ CAPABILITIES.md auto-generated from available skills, agents, and teams — v1.8
- ✓ Phase capability declarations in ROADMAP.md with use/create/after/adapt verbs — v1.8
- ✓ Plan frontmatter capabilities field with skill/agent/team references — v1.8
- ✓ Skill injection into executor context during plan execution — v1.8
- ✓ Dynamic capability creation as plan tasks (project-local .claude/) — v1.8
- ✓ Post-phase automatic capability invocation (after verb) — v1.8
- ✓ Capability discovery during new-project and new-milestone workflows — v1.8
- ✓ Cache-aware skill ordering with cacheTier metadata and deterministic sort — v1.8
- ✓ Research-to-skill compression pipeline with compress-research CLI — v1.8
- ✓ Model-aware skill activation with modelGuidance metadata — v1.8
- ✓ Agent-level token budgets with per-agent profiles for GSD agents — v1.8
- ✓ Collector agent generation for read-only context-efficient subagents — v1.8
- ✓ Parallelization advisor for wave-based parallel execution recommendations — v1.8
- ✓ Token budget estimation CLI (budget-estimate) with threshold warnings — v1.8

### Active

(None — start next milestone with `/gsd:new-milestone`)

### Out of Scope

- Agent Teams native integration — deferred to v2.0 (high effort, needs Claude Code Agent Teams maturity)
- Capability versioning (project-local overrides track base version) — deferred to v2.0
- Capability composition (teams referencing project-specific agents) — deferred to v2.0
- Capability testing (verify created agents/skills work before using them) — deferred to v2.0
- Cross-project capability sharing (promote project-local to global) — deferred to v2.0
- Capability dependency graphs (agent A requires skill B) — deferred to v2.0
- AgentBus message queue abstraction — deferred to v2.0 (DirectBus sufficient for in-process)
- Message gateway for Slack/Teams/Discord — deferred to v2.0
- Cross-session persistent conversation memory beyond STATE.md — deferred to v2.0
- Multi-project orchestration — deferred to v2.0
- Skill registry/marketplace — deferred to v2.0
- MCP/A2A protocol support — deferred to v2.0
- Per-instruction model coverage — whole-skill targeting via modelGuidance sufficient (shipped v1.8)
- Full token usage reporting — GSD inside Claude Code has no access to API token metrics
- Automatic model selection — advisory-only approach proved sufficient in v1.8
- OpenAI/other provider support — using Anthropic only for consistency
- Automatic edge case generation (GEN-03) — deferred, manual addition supported
- Runtime agent orchestration — Claude Code handles spawning/messaging; we manage configs
- Team monitoring dashboard — runtime concern outside creation/validation scope
- Cross-team coordination — Claude Code limitation: one team per session
- Controlling Claude Code's output — orchestrator controls its own output only
- Full conversation replay — session snapshots capture summaries, not raw transcripts

## Context

Shipped v1.8 with 90,447 LOC TypeScript. Nine milestones shipped (v1.0-v1.8) covering format compliance, validation enhancements, quality assurance, documentation, agent teams, pattern discovery, example artifacts, master orchestration, and capability-aware planning with token efficiency.

**v1.8 capability-aware planning + token efficiency:**
- SkillPipeline: composable pipeline architecture with 6 pluggable stages replacing monolithic apply()
- Token budgets: per-agent profiles with critical/standard/optional priority tiers, budget-estimate CLI
- Capability manifest: auto-generated CAPABILITIES.md with dual-scope discovery (global + project-local)
- Phase capability declarations: use/create/after/adapt verbs parsed from ROADMAP.md with plan inheritance
- Skill injection: auto-inject referenced skills into executor context with critical budget tier
- Capability scaffolding: create-verb phases generate plan tasks for new skill/agent files
- Cache-aware ordering: cacheTier (static/session/dynamic) sort within relevance bands for prompt cache optimization
- Research compression: 10-20x reduction with content hash tracking, staleness detection, manual-wins conflict
- Model-aware activation: modelGuidance metadata with graceful skip on profile mismatch
- Post-phase invocation: after-verb auto-triggers on verification pass
- Collector agents: auto-generated read-only agents for context-efficient information gathering
- Parallelization advisor: Kahn's algorithm wave assignment from file dependency graph

Tech stack: TypeScript 5.3, Node.js 22, gray-matter for YAML parsing, zod for validation, @huggingface/transformers for local embeddings, @anthropic-ai/sdk for optional LLM analysis, natural for NLP/Bayes classification, @clack/prompts for interactive wizards, js-yaml for role/workflow/bundle/work-state YAML, picocolors for CLI output.

Well-structured with layers for observation, detection, storage, application, learning, composition, embeddings, conflicts, activation, testing, simulation, calibration, teams, discovery, orchestrator, work-state, session-continuity, ephemeral-observations, workflows, roles, bundles, events, pipeline, budgets, capabilities, cache, compression, model-filter, invoker, collector, parallelization.

Known issue: User-level agent discovery bug (#11205) — documented with workarounds.

## Constraints

- **Official format compliance**: All output must match Claude Code specifications
- **Backward compatibility**: Migration paths for skills created with older versions
- **Minimal runtime impact**: Validation happens during creation, not at Claude Code load time
- **Zero required API cost**: All core features work with local-only processing
- **GSD core is source of truth**: Orchestrator adapts to upstream changes, never replaces commands

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Extension fields under metadata.extensions namespace | Official field compatibility | ✓ Good — clean separation |
| Migrate-on-write for legacy skills | Zero-effort upgrade path | ✓ Good — seamless migration |
| Reserved name validation with --force override | Safety with escape hatch | ✓ Good — prevents common errors |
| Tiered budget warnings (60/80/100%) | Progressive guidance | ✓ Good — actionable feedback |
| Project scope default with --project flag | Matches most common use case | ✓ Good — intuitive UX |
| Agent tools as comma-separated string | Official Claude Code format | ✓ Good — ensures compatibility |
| Local embeddings via HuggingFace (not Voyage API) | Zero API cost, offline capability | ✓ Good — no credentials needed |
| High default threshold (0.85) for conflicts | Avoid false positives | ✓ Good — precision over recall |
| 5-factor heuristic scoring | Comprehensive without complexity | ✓ Good — fast and explainable |
| Dynamic SDK imports | Avoid bundling unused dependencies | ✓ Good — smaller footprint |
| Never-throw API pattern | Graceful degradation everywhere | ✓ Good — resilient UX |
| Default threshold 0.75 | Conservative before calibration | ✓ Good — errs on not activating |
| Too-close-to-call at <2% margin | Balances sensitivity with noise | ✓ Good — actionable hints |
| F1 score as optimization target | Balanced precision and recall | ✓ Good — industry standard |
| MCC for correlation metric | Pearson for binary classification | ✓ Good — standard metric |
| Global calibration storage | Cross-project threshold tuning | ✓ Good — shared learning |
| GEN-03 deferred | Edge cases harder to auto-generate | ✓ Good — manual addition works |
| Tools on TeamMember via index signature | Forward-compat without type changes | ✓ Good — survives schema evolution |
| Pipeline lead as 'orchestrator', others as 'coordinator' | Distinguish routing vs delegation | ✓ Good — clear role semantics |
| Most GSD workflows stay as subagents | Only parallel research and debugging benefit from teams | ✓ Good — avoids coordination overhead |
| Schema validation early-return on failure | No point running 7 validators on invalid schema | ✓ Good — fast failure |
| Errors blocking, warnings informational | Tool overlap/skill conflicts are advisory | ✓ Good — correct severity levels |
| Kahn's algorithm for cycle detection | Standard topological sort approach | ✓ Good — well-understood algorithm |
| Levenshtein for fuzzy agent suggestions | No external deps needed for simple matching | ✓ Good — minimal dependencies |
| Streaming line-by-line JSONL parsing | 23MB+ session files can't load into memory | ✓ Good — handles large corpus |
| 4-layer noise classification for user entries | 97% of user entries are tool results/meta; ordered by frequency | ✓ Good — fast filtering |
| Composite key (projectSlug:sessionId) | Defensive against UUID collision across projects | ✓ Good — unique identification |
| Watermark-based incremental scanning | Only process new/modified sessions on re-run | ✓ Good — fast subsequent scans |
| Dual-threshold noise filter (15+ projects AND 80%+) | Avoid filtering user patterns that happen to be common | ✓ Good — precision over recall |
| Log2 frequency scaling capped at 1.0 | Prevents high-count patterns from dominating score | ✓ Good — balanced ranking |
| DBSCAN with epsilon auto-tuning | No pre-set K required, handles noise points naturally | ✓ Good — adaptive clustering |
| Per-project-then-merge clustering strategy | Better clusters within project context, then merge similar | ✓ Good — quality over speed |
| Direct file write for draft skills (not SkillStore) | Avoids validation overhead for generated drafts | ✓ Good — faster output |
| GSD core is source of truth, orchestrator adapts dynamically | Resilience to upstream changes, no hardcoded command lists | ✓ Good — survived GSD updates |
| Dynamic filesystem discovery over manifest | Adapts to any GSD version without code changes | ✓ Good — zero maintenance |
| Default GSD only on first install | Users get value immediately without custom setup | ✓ Good — instant utility |
| gsd-skill-creator as optional extension | Progressive enhancement, not hard dependency | ✓ Good — graceful degradation verified |
| Artifact-driven lifecycle transitions | State-reading vs hardcoded state machine | ✓ Good — adapts to new commands |
| Async classify() API | Enables embedding fallback without blocking | ✓ Good — seamless enhancement |
| Two-layer agent architecture | Layer 1 standalone, Layer 2 enhanced | ✓ Good — works everywhere |
| JSONL pattern envelope for all stores | Consistent format across workflows/events/snapshots | ✓ Good — unified storage |
| ESM hook scripts with silent failure | Never blocks session lifecycle | ✓ Good — invisible persistence |
| Bron-Kerbosch for clique detection | Sufficient for small skill graphs | ✓ Good — correct algorithm |
| Squash-then-evaluate for ephemeral promotion | Aggregate quality matters, not individual | ✓ Good — better signal |
| SkillPipeline with pluggable stages | Composable architecture over monolithic apply() | ✓ Good — clean stage isolation, easy extension |
| Context carries data, stages hold services | Constructor injection separates concerns | ✓ Good — testable, no hidden coupling |
| Pipeline earlyExit checked by stages not runner | Stages own their control flow | ✓ Good — flexible stage-level exit logic |
| Critical skills tracked separately from standard budget | Prevent skill starvation for declared capabilities | ✓ Good — critical skills always load |
| Content hash from raw file content (not parsed objects) | Stability across parser changes | ✓ Good — deterministic hashing |
| Placeholder-based pipe splitting for manifest parsing | Handle escaped pipes in markdown tables | ✓ Good — robust parsing |
| Create verb always bypasses validation | Declares intent, not dependency | ✓ Good — correct semantics |
| All declared capabilities get critical tier | Declared = must-load for executor | ✓ Good — reliable skill injection |
| Name-based mock registry for pipeline stage tests | Avoids sequential mock ordering bugs | ✓ Good — reliable tests |
| Kahn's algorithm for parallelization wave assignment | Standard topological sort for DAG-based scheduling | ✓ Good — well-understood, correct |
| Conservative default: plans sequential unless proven independent | Safety first for parallelization | ✓ Good — prevents incorrect parallel execution |
| Zero new npm dependencies for v1.8 | Minimize supply chain surface | ✓ Good — no new deps needed |
| Pipeline order: Score -> Resolve -> ModelFilter -> CacheOrder -> Budget -> Load | CacheOrder before Budget for optimal ordering | ✓ Good — correct stage sequencing |
| ModelFilterStage conditionally inserted (not always present) | Backward compatible when no model profile | ✓ Good — zero-cost when unused |
| Manual skills always win over auto-generated | User intent takes precedence | ✓ Good — predictable conflict resolution |

---
*Last updated: 2026-02-09 after v1.8 milestone*
