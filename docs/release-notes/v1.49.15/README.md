# v1.49.15 — Self-Improving Mesh Architecture

**Shipped:** 2026-03-04
**Phases:** 5 (50-54) | **Plans:** 19 | **Commits:** 41
**Files:** 98 changed | **New Code:** ~17,400 LOC TypeScript in `src/`
**Tests:** 594 new (23,994 total passing)

## Summary

A complete multi-model mesh architecture spanning five phases: model abstraction layer, multi-model evaluation, MCP infrastructure, mesh orchestration, and context integration. Enables skill-creator to distribute work across multiple LLM providers with automatic failover, cost-aware routing, and quality-preserving context transfer.

## Key Features

### Phase 50: Model Abstraction Layer
- Chip drivers for OpenAI-compatible and Anthropic endpoints
- ChipRegistry with CLI integration
- chipset.json configuration with Zod-validated schemas

### Phase 51: Multi-Model Evaluation
- Benchmark schema, grader calibration, threshold configuration
- Model-aware grading with tier detection and capability profiling

### Phase 52: MCP Infrastructure
- LLM Wrapper with per-chip queuing and timeout handling
- Mesh Discovery with node health monitoring and stale eviction
- DACP Transport with provenance tracking and fidelity-adaptive compression

### Phase 53: Mesh Orchestration
- Pure scoring functions (scoreNode, rankNodes, selectWithFallback)
- MeshCoordinator with dispatch, fan-out, pipeline, and automatic failover
- VTM wave planner and multi-model optimizer

### Phase 54: Context & Integration
- Context preservation across mesh boundaries with transcript summarization
- Mesh git worktrees with proxy committer for git-less nodes
- Skill manifest and packager with tested_models and mesh_hints
- Skill Creator MCP Server with 8 pipeline tools
