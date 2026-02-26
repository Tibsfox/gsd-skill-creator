# v1.8 — Capability-Aware Planning + Token Efficiency

**Shipped:** 2026-02-08
**Phases:** 51-61 (10 phases) | **Plans:** 28 | **Requirements:** 28

Skill pipeline architecture with per-agent token budgets, capability manifests, cache ordering, research compression, and parallelization advisor.

### Key Features

**6-Stage Skill Loading Pipeline:**
Score -> Resolve -> ModelFilter -> CacheOrder -> Budget -> Load

- Composable pipeline with pluggable stages replacing monolithic skill loading
- Per-agent token budget profiles with critical/standard/optional priority tiers
- Capability manifests and phase declarations for smart skill filtering
- Cache-aware skill ordering with cacheTier metadata for prompt cache efficiency

**Planning Enhancements:**
- Skill injection into GSD executor agent contexts
- Research compression with 10-20x document reduction and staleness detection
- Model-aware activation filtering based on agent capabilities
- Collector agents for gathering distributed skill data

**Execution Optimization:**
- Parallelization advisor for wave-based execution from plan dependency analysis
- Phase capability declarations for targeted skill loading

---
