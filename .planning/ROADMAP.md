# Roadmap: gsd-skill-creator

## Milestones

- [x] **v1.49.5** - Project Filesystem Reorganization (Phases 1-5, shipped 2026-02-27)
- [x] **v1.49.6** - Cross-Platform Hardening & Native Dep Cleanup (shipped 2026-03-01)
- [x] **v1.49.7** - Optional tmux with Graceful Degradation (shipped 2026-03-01)
- [x] **v1.49.8** - Cooking With Claude (Phases 6-16, shipped 2026-03-01)
- [x] **v1.49.9** - Learn Kung Fu (Phases 17-27, shipped 2026-03-01)
- [x] **v1.49.12** - Heritage Skills Educational Pack (Phases 28-39, shipped 2026-03-02)
- [x] **v1.49.13** - Skill Usage Telemetry & Adaptive Pipeline (Phases 40-43, shipped 2026-03-03)
- [x] **v1.49.14** - Dependency Health Monitor & Progressive Internalization Engine (Phases 44-49, shipped 2026-03-03)
- [ ] **v1.49.15** - Self-Improving Mesh Architecture (Phases 50-54, active)

---

<details>
<summary>Completed milestones v1.49.5 through v1.49.9 (Phases 1-27) — SHIPPED</summary>

Phases 1-27 completed across five milestones. See MILESTONES.md for full accomplishment records.

- v1.49.5: Filesystem reorganization (Phases 1-5)
- v1.49.6: Cross-platform hardening, native dep cleanup, lightweight NLP (Phases 6-11, within v1.49.8 numbering)
- v1.49.7: Optional tmux, graceful degradation
- v1.49.8: Rosetta Core, College Structure, Calibration Engine, Cooking Department, 9 panels, 650+ tests (Phases 6-16)
- v1.49.9: Mind-body department, 8 wings, Training Hall, Practice Builder, Practice Journal, Safety Warden, 751 new tests (Phases 17-27)

</details>

<details>
<summary>Completed milestone v1.49.12 Heritage Skills Educational Pack (Phases 28-39) — SHIPPED 2026-03-02</summary>

47 requirements complete across 12 phases. See MILESTONES.md for full accomplishment record.

- Phase 28: Foundation Types — shared TypeScript types and schemas
- Phase 29: Core Infrastructure + Ethics — Safety Warden, Cultural Sovereignty Warden, Northern Ways, Canonical Works Library
- Phase 30: Ontology + Safety-Critical Rooms — SUMO Heritage ontology, 4 life-safety rooms
- Phase 31: Standard Rooms Part 1 — Building, Fiber, Animals, Woodcraft rooms
- Phase 32: Standard Rooms Part 2 + Cultural — Community/Culture, Music, Metalwork, Pottery, Seasonal, History rooms
- Phase 33: Oral History + Authoring Pipeline — Interview methodology, simulator, Heritage Book pipeline
- Phase 34: Integration + Verification (Phase 1) — chipset config, integration tests, safety audit, Phase 1 README
- Phase 35: Badge Engine Types — Trail Badge type system (9 paths, 4 tiers)
- Phase 36: Cross-Cutting Modules + Badge Engine — Salish Sea Ways, Marine Safety, Badge progression engine
- Phase 37: Pacific Northwest Coast Rooms — Cedar Culture, Salmon World, Salish Weaving, Village World
- Phase 38: Extensions + Retrofit — Reconnecting Descendant Pathway, badge retrofit, SEL mapping
- Phase 39: Integration + Verification (Phase 2) — safety audit, integration tests, final README

</details>

<details>
<summary>Completed milestone v1.49.13 Skill Usage Telemetry & Adaptive Pipeline (Phases 40-43) — SHIPPED 2026-03-03</summary>

28 requirements complete across 4 phases. See MILESTONES.md for full accomplishment record.

- Phase 40: Event Emission Layer — UsageEvent types, JSONL EventStore, TelemetryStage, sessionId tracking
- Phase 41: Pattern Detection — UsagePatternDetector identifying 7 skill health patterns
- Phase 42: Adaptive Feedback Loop — ScoreAdjuster, CachePromoter, AdaptiveSuggestions, budget ordering
- Phase 43: Integration + Privacy + Full Test Suite — sc:digest integration, privacy safety, retention limits, 102 tests

</details>

<details>
<summary>Completed milestone v1.49.14 Dependency Health Monitor & Progressive Internalization Engine (Phases 44-49) — SHIPPED 2026-03-03</summary>

30 requirements complete across 6 phases. See MILESTONES.md for full accomplishment record.

- Phase 44: Dependency Auditor — manifest discovery (5 ecosystems), registry adapters, OSV.dev vulnerability scanning, incremental scan, pre-install dry-run gate, rate-limiter
- Phase 45: Health Diagnostician — 6-class classifier, ecosystem-aware scoring, Python compat matrix, cross-dependency conflict detection, P0-P3 severity assignment
- Phase 46: Alternative Discoverer — SuccessorDetector, ForkFinder, EquivalentSearcher, InternalizationFlagger, DiscoveryOrchestrator with evidence-backed alternative reports
- Phase 47: Dependency Resolver — ManifestBackup, ProposalDryRunner, HITLApprovalGate, RollbackEngine, ManifestPatcher, ResolverOrchestrator — one dep per resolution with instant rollback
- Phase 48: Code Absorber — AbsorptionCriteriaGate (hard blocks: crypto/parser/protocol/compression), OracleVerifier (10K+ cases), CallSiteReplacer (≤20% per cycle), InternalizationRegistry (append-only JSONL), AbsorberOrchestrator
- Phase 49: Integration + Health Log + Pattern Learning — append-only health.jsonl, StagingHealthGate (pure function gate), PatternLearner (Set-dedup, threshold 5), IntegrationOrchestrator unified API

</details>

---

## v1.49.15: Self-Improving Mesh Architecture

**Goal:** Build a self-improving, mesh-capable knowledge system where tested procedural intelligence flows between cloud reasoning (Claude) and local compute (commodity hardware running local LLMs), with skills as the portable unit of knowledge, MCP as the protocol layer, and the eval loop as the engine of continuous improvement.

**Codename:** The Space Between

**Waves:** 5 strictly sequential (Wave 1 → 2 → 3 → 4 → 5); tasks within waves can parallelize.

## Phases

- [x] **Phase 50: Model Abstraction** - ModelChip interface, OpenAI-compatible and Anthropic chips, ChipRegistry, CLI integration, backward compatibility (COMPLETE 2026-03-03)
- [x] **Phase 51: Multi-Model Evaluation** - Benchmark schema extension, grader cross-model calibration, thresholds.json, eval viewer model filter (COMPLETE 2026-03-03)
- [ ] **Phase 52: MCP Infrastructure** - Local LLM MCP Wrapper, Mesh Discovery Service, DACP mesh transport, fidelity adaptation
- [ ] **Phase 53: Mesh Orchestration** - Mesh Coordinator agent, VTM mesh-aware wave planning, cross-model optimization, cost-aware routing
- [ ] **Phase 54: Context & Integration** - Context preservation, transcript summarizer, mesh git worktrees, Skill Creator MCP Server

## Phase Details

### Phase 50: Model Abstraction
**Goal**: Any model can execute skill evals through a uniform interface, with Claude as grader and existing workflows unchanged
**Depends on**: Phase 49 (prior milestone complete)
**Requirements**: CHIP-01, CHIP-02, CHIP-03, CHIP-04, CHIP-05, CHIP-06, IMP-03, IMP-05
**Success Criteria** (what must be TRUE):
  1. User can run an existing skill's eval suite against a local Ollama model by passing `--chip ollama` to the CLI — no other config changes required
  2. Claude grader evaluates local model output without modification — asymmetric evaluation (local execute, Claude grade) works out of the box
  3. A workspace without chipset.json runs all existing evals identically to before this phase (backward compatibility enforced)
  4. ChipRegistry reports the health and capabilities of each configured backend — user can query which chips are available and what each can do
  5. A threshold registry document (thresholds.md) exists at project root capturing every hardcoded numeric constant introduced in this phase with rationale and file:line reference
**Plans:** 3/3 plans complete

Plans:
- [x] 50-01-PLAN.md — ModelChip types, OpenAI-compatible chip, Anthropic chip, IMP-05 cross-reference
- [x] 50-02-PLAN.md — ChipRegistry, ChipFactory, chipset.json discovery, backward compatibility
- [x] 50-03-PLAN.md — CLI chip command, --chip/--grader-chip flags, ChipTestRunner, thresholds.md

### Phase 51: Multi-Model Evaluation
**Goal**: The same skill can be benchmarked across multiple models simultaneously, with per-model pass rates and threshold-relative status visible in the eval viewer
**Depends on**: Phase 50
**Requirements**: EVAL-01, EVAL-02, EVAL-03, EVAL-04, EVAL-05, EVAL-06
**Success Criteria** (what must be TRUE):
  1. Running a skill benchmark produces a results file with separate pass rates for each model — user sees at a glance which model performs best on that skill
  2. The eval viewer shows a model filter dropdown — user can isolate results for one model or view all models side-by-side
  3. The grader produces model-specific improvement hints when it knows a model's capability profile — a known-limitation case yields different guidance for Claude vs a smaller local model
  4. Legacy benchmark files without a model field display correctly in the viewer — no regressions for existing benchmark history
  5. Test-to-source ratio for this phase is tracked and reported in the verification record, targeting >=3:1
**Plans:** 3/3 plans complete

Plans:
- [x] 51-01-PLAN.md — Eval types, Zod schemas (ModelBenchmarkRun, MultiModelBenchmark), ThresholdsConfigLoader
- [x] 51-02-PLAN.md — MultiModelBenchmarkRunner, ModelAwareGrader with capability-driven hints
- [x] 51-03-PLAN.md — EvalViewer formatting engine, CLI eval command, thresholds.md update, IMP-04 tracking

### Phase 52: MCP Infrastructure
**Goal**: Two machines can communicate via DACP-over-MCP with provenance tracking, and mesh nodes register, advertise capabilities, and are evicted when unhealthy
**Depends on**: Phase 51
**Requirements**: MCP-01, MCP-02, MCP-03, MCP-04, MCP-05, MCP-06, IMP-01, IMP-07
**Success Criteria** (what must be TRUE):
  1. Claude Code can invoke a local model through the LLM MCP Wrapper — user sees `llm.chat`, `llm.health`, `llm.capabilities`, `llm.models` as available MCP tools
  2. Two or more mesh nodes register with the Discovery Service, advertise capabilities via heartbeat, and an unhealthy node (3 missed heartbeats) is automatically removed from the routing pool
  3. A DACP bundle sent from node A to node B arrives with a provenance header recording origin, hops, and timestamps — user can audit the bundle's journey
  4. Bundle size adapts to transport conditions — a bundle sent over a slow link is measurably more compressed than one sent locally
  5. Every lifecycle method with automatic behavior (heartbeat expiry, stale node eviction) has an integration test verifying auto-invocation — not just unit correctness
  6. Mesh event logs use append-only writes (`fs.appendFile`) — no overwrite possible by construction
**Plans:** 3 plans

Plans:
- [x] 52-01-PLAN.md — LLM MCP Wrapper: 4 MCP tools (llm.chat, llm.health, llm.capabilities, llm.models), connection pooling, request queuing
- [ ] 52-02-PLAN.md — Mesh Discovery Service: node registration, heartbeat monitoring, auto-eviction, append-only event log
- [ ] 52-03-PLAN.md — DACP mesh transport: provenance tracking, fidelity-adaptive compression, multi-hop relay

### Phase 53: Mesh Orchestration
**Goal**: VTM wave plans route tasks to mesh nodes based on capability and cost, with automatic failover and model-specific optimization output
**Depends on**: Phase 52
**Requirements**: MESH-01, MESH-02, MESH-03, MESH-04, MESH-05, MESH-06, IMP-02, IMP-06
**Success Criteria** (what must be TRUE):
  1. A VTM wave plan with 3 tasks routes each task to a different mesh node — user sees per-task node annotations (target, fallback, routing justification) in the plan file
  2. When a node fails mid-wave, the coordinator automatically reroutes to the designated fallback — the wave continues without user intervention
  3. Running `run_loop --target-chips ollama,claude` produces model-specific SKILL.md guidance for each target — user gets separate improvement paths per model
  4. The cost routing policy favors local execution when local pass rate exceeds the configured threshold — user can confirm routing decisions from routing_policy.json
  5. An inter-wave integration review document exists for the Wave 3 → Wave 4 boundary, assessing cross-wave connections and confirming the mesh coordinator can use all Wave 3 transport primitives
  6. All scoring and routing logic is pure functions — no I/O in hot paths, fully testable without mocks
**Plans**: TBD

### Phase 54: Context & Integration
**Goal**: A multi-wave distributed workflow produces complete git history with mesh provenance, context summaries integrated into GSD state, and the full pipeline is invocable from claude.ai
**Depends on**: Phase 53
**Requirements**: CTXT-01, CTXT-02, CTXT-03, CTXT-04, CTXT-05, CTXT-06
**Success Criteria** (what must be TRUE):
  1. A task executed on a remote mesh node produces a context summary that a downstream local task can read — decision rationale is preserved across the mesh boundary without manual copy-paste
  2. From claude.ai, user triggers a skill eval run on a remote Claude Code instance and sees results in the conversation — the full create/eval/grade/compare/analyze/optimize/package/benchmark pipeline is available via MCP tools
  3. Git history shows `mesh/<node-id>/<task-id>` branches with proper merge handling — user can audit which mesh node produced which artifact
  4. A mesh node without git capability returns artifacts to local GSD, which commits on its behalf — git history remains complete even for simple nodes
  5. A packaged skill file includes manifest.json (with tested_models and mesh_hints), a variants/ directory, and a benchmarks/ history directory — user can distribute a skill that carries its own model-specific tuning
**Plans**: TBD

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 50. Model Abstraction | 3/3 | Complete    | 2026-03-03 |
| 51. Multi-Model Evaluation | 3/3 | Complete    | 2026-03-03 |
| 52. MCP Infrastructure | 1/3 | In progress | - |
| 53. Mesh Orchestration | 0/? | Not started | - |
| 54. Context & Integration | 0/? | Not started | - |
