# Requirements: gsd-skill-creator v1.49.15

**Defined:** 2026-03-03
**Core Value:** Skills are discovered from real patterns and proved against mathematical foundations — the unit circle isn't metaphor, it's architecture.
**Milestone:** Self-Improving Mesh Architecture ("The Space Between")

## v1 Requirements

Requirements for v1.49.15 release. Each maps to roadmap phases.

### Model Abstraction

- [x] **CHIP-01**: System provides abstract ModelChip interface with chat(), health(), and capabilities() methods
- [x] **CHIP-02**: System provides OpenAI-compatible chip covering Ollama, vLLM, and LM Studio via single parameterized implementation
- [x] **CHIP-03**: System provides Anthropic chip wrapping existing API behind ModelChip interface
- [x] **CHIP-04**: ChipRegistry discovers available chips from chipset.json, validates connectivity, and maps role names to chip instances
- [x] **CHIP-05**: CLI `test run` gains `--chip` for per-run model execution and `--grader-chip` for per-run grader selection enabling asymmetric evaluation (originally spec'd as `run_eval`/`improve_description` -- mapped to actual CLI commands, see Plan 50-03 mapping note)
- [x] **CHIP-06**: Absence of chipset.json preserves current behavior (backward compatible)

### Multi-Model Evaluation

- [x] **EVAL-01**: Benchmark schema gains `model` field per run with per-model summary breakdowns
- [x] **EVAL-02**: Aggregate benchmark produces configuration x model matrix without breaking existing per-configuration output
- [x] **EVAL-03**: Grader receives model capability profile and produces model-specific improvement hints
- [x] **EVAL-04**: thresholds.json defines per-chip pass rate thresholds with configurable defaults
- [x] **EVAL-05**: Eval viewer gains model filter dropdown with side-by-side comparison and threshold-relative display
- [x] **EVAL-06**: Legacy benchmarks without model field display correctly (backward compatible)

### MCP Infrastructure

- [x] **MCP-01**: Local LLM MCP Wrapper exposes llm.chat, llm.models, llm.health, llm.capabilities tools
- [x] **MCP-02**: LLM Wrapper handles connection pooling, request queuing, and capability probing
- [x] **MCP-03**: Mesh Discovery Service supports node registration, deregistration, heartbeat monitoring, and health reporting
- [x] **MCP-04**: Discovery Service marks nodes unhealthy after 3 missed heartbeats and removes them from routing pool
- [x] **MCP-05**: DACP mesh transport sends bundles between nodes via MCP with provenance tracking (origin, hops, timestamps)
- [x] **MCP-06**: Fidelity adaptation adjusts bundle compression based on transport conditions (full local, standard mesh, compressed remote)

### Mesh Orchestration

- [ ] **MESH-01**: Mesh Coordinator agent routes skills to optimal nodes based on capability match, current load, and historical performance
- [ ] **MESH-02**: Coordinator supports parallel dispatch (same skill across multiple nodes) and pipeline dispatch (different skills to specialized nodes)
- [ ] **MESH-03**: VTM wave plans gain per-task node annotation with target, fallback, and routing justification
- [ ] **MESH-04**: Node failure mid-wave triggers automatic reroute to fallback node
- [ ] **MESH-05**: Cost-aware routing policy favors local execution when pass rate exceeds configurable threshold
- [ ] **MESH-06**: run_loop gains `--target-chips` for simultaneous multi-model optimization producing model-specific guidance

### Context & Integration

- [ ] **CTXT-01**: Mesh result ingestion converts remote execution output into local GSD state with context summaries preserving decision rationale
- [ ] **CTXT-02**: Transcript summarizer compresses execution transcripts at mesh boundaries without information loss at the decision level
- [ ] **CTXT-03**: Mesh-aware git worktrees create `mesh/<node-id>/<task-id>` branches with proper merge handling
- [ ] **CTXT-04**: Simple mesh nodes (no git) return artifacts; local GSD commits on their behalf
- [ ] **CTXT-05**: Skill package extended with manifest.json (tested_models, mesh_hints), variants/ directory, and benchmarks/ history
- [ ] **CTXT-06**: Skill Creator MCP Server exposes full pipeline (create, eval, grade, compare, analyze, optimize, package, benchmark) for claude.ai invocation

### Iterative Improvement

- [x] **IMP-01**: Every lifecycle method has an integration test verifying auto-invocation (not just unit correctness)
- [ ] **IMP-02**: Inter-wave integration review gate at each wave boundary assessing cross-wave connections
- [x] **IMP-03**: Threshold registry (thresholds.md) documents every hardcoded numeric value with rationale and file:line
- [x] **IMP-04**: Test-to-source ratio tracked per wave in verification reports (target >=3:1)
- [x] **IMP-05**: v1.49.14 deferred items cross-referenced (ADVN-03 cost analysis, ADVN-04 auto PR, EREG-01 private registries)
- [ ] **IMP-06**: Pure-function enforcement for all scoring and routing logic (no I/O in hot paths)
- [x] **IMP-07**: Append-only pattern applied to mesh event logs (reuse v1.49.14 health.jsonl pattern)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Extended Registry Support (from v1.49.14)

- **EREG-02**: Monorepo dependency analysis with shared constraints across multiple manifests
- **EREG-03**: Container-level dependency scanning (Dockerfile analysis)

### Advanced Features (from v1.49.14)

- **ADVN-01**: ML-based alternative recommendation (v1 uses heuristic ranking)
- **ADVN-02**: License compliance analysis beyond basic compatibility

### Mesh Extensions

- **MEXT-01**: Multi-datacenter mesh with WAN-optimized transport
- **MEXT-02**: Mesh node auto-scaling based on queue depth
- **MEXT-03**: Federated skill sharing across mesh networks

## Out of Scope

| Feature | Reason |
|---------|--------|
| Public mesh networking | Mesh nodes are user-owned local hardware only — no public network exposure |
| Lowering grader quality for local models | Grader/analyzer always run on Claude — asymmetric evaluation is a design constraint |
| Executable code in DACP bundles | Security boundary — instructions and data only, no code execution |
| Real-time streaming across mesh | Batch execution sufficient for v1; streaming adds complexity without clear value |
| v1.50.x integration | Separate branch, future release — hard scope boundary |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CHIP-01 | Phase 50 | Complete (50-01) |
| CHIP-02 | Phase 50 | Complete (50-01) |
| CHIP-03 | Phase 50 | Complete (50-01) |
| CHIP-04 | Phase 50 | Complete |
| CHIP-05 | Phase 50 | Complete (50-03) |
| CHIP-06 | Phase 50 | Complete |
| EVAL-01 | Phase 51 | Complete |
| EVAL-02 | Phase 51 | Complete |
| EVAL-03 | Phase 51 | Complete |
| EVAL-04 | Phase 51 | Complete |
| EVAL-05 | Phase 51 | Complete |
| EVAL-06 | Phase 51 | Complete |
| MCP-01 | Phase 52 | Complete (52-01) |
| MCP-02 | Phase 52 | Complete (52-01) |
| MCP-03 | Phase 52 | Complete |
| MCP-04 | Phase 52 | Complete |
| MCP-05 | Phase 52 | Complete |
| MCP-06 | Phase 52 | Complete |
| MESH-01 | Phase 53 | Pending |
| MESH-02 | Phase 53 | Pending |
| MESH-03 | Phase 53 | Pending |
| MESH-04 | Phase 53 | Pending |
| MESH-05 | Phase 53 | Pending |
| MESH-06 | Phase 53 | Pending |
| CTXT-01 | Phase 54 | Pending |
| CTXT-02 | Phase 54 | Pending |
| CTXT-03 | Phase 54 | Pending |
| CTXT-04 | Phase 54 | Pending |
| CTXT-05 | Phase 54 | Pending |
| CTXT-06 | Phase 54 | Pending |
| IMP-01 | Phase 52 | Complete |
| IMP-02 | Phase 53 | Pending |
| IMP-03 | Phase 50 | Complete (50-03) |
| IMP-04 | Phase 51 | Complete (51-03) |
| IMP-05 | Phase 50 | Complete (50-01) |
| IMP-06 | Phase 53 | Pending |
| IMP-07 | Phase 52 | Complete |

**Coverage:**
- v1 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0

---
*Requirements defined: 2026-03-03*
*Last updated: 2026-03-03 — MCP-01, MCP-02 marked complete (52-01 executed)*
