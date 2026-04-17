# Retrospective — v1.8

## What Worked

- **The 6-stage loading pipeline (Score-Resolve-ModelFilter-CacheOrder-Budget-Load) replaces monolithic skill loading with composable stages.** Each stage does one thing. Stages can be swapped, reordered, or extended independently. This is the right architecture for a system where loading requirements will keep evolving.
- **Per-agent token budget profiles with priority tiers (critical/standard/optional) make resource allocation explicit.** Without tiers, budget pressure would force arbitrary skill ejection. With tiers, the system knows what to drop first.
- **Research compression with 10-20x document reduction is a force multiplier.** Large research documents consume token budget without proportional value. Compression with staleness detection keeps the signal-to-noise ratio high.

## What Could Be Better

- **Cache-aware skill ordering (cacheTier metadata) depends on prompt cache behavior that may change.** Optimizing for prompt cache hit rates couples the system to LLM implementation details that aren't part of any stable API contract.
- **The parallelization advisor analyzes plan dependencies to suggest wave-based execution, but wave execution itself isn't implemented yet.** The advisor produces recommendations that can't be acted on automatically until later versions add execution support.

## Lessons Learned

1. **Capability manifests make skills self-describing.** A skill that declares what it needs (model capabilities, phase context) can be filtered without loading and inspecting its content. This is metadata-driven activation.
2. **Composable pipelines beat monolithic functions every time.** The v1.7 orchestrator loaded skills in one step. The v1.8 pipeline breaks that into 6 stages, each independently testable and replaceable.
3. **Wave-based execution from dependency analysis is the natural parallelization strategy for plans.** Tasks with no dependencies run in parallel; tasks with dependencies wait. The plan's DAG structure determines the execution schedule.

---
