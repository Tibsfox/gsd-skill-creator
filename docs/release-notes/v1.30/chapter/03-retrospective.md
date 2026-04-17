# Retrospective — v1.30

## What Worked

- **Vision → Research → Mission as a typed pipeline.** Each stage has Zod schemas, typed inputs/outputs, and configurable skipping. The pipeline is composable -- you can run vision processing alone, or the full chain, or skip research if you already have it. This flexibility comes from treating each stage as an independent transform.
- **Wave planning with greedy graph coloring for parallel track detection.** The dependency graph generator identifies which tasks can run in parallel, marks the critical path, and calculates sequential savings. This is the algorithmic foundation for the multi-agent execution patterns used in later releases.
- **Downgrade-only auto-rebalance for model assignment.** Opus → Sonnet → Haiku, never upgrade. This enforces the 60/40 budget principle mechanically -- if a plan is over-budget, it downgrades model assignments until it fits. The confidence scoring and weighted signal registry make the initial assignment data-driven.

## What Could Be Better

- **Template system uses Mustache-style {{name}} rendering.** Simple and effective, but the 7-template registry is static. As the system grows, a template discovery mechanism or directory-based registration would scale better.
- **679 tests across 26 plans for 14 phases is adequate but the pipeline orchestrator (Phases 288-292) is the most critical component.** Error classification into recoverable/unrecoverable is good, but the recovery paths for recoverable errors aren't detailed in the release notes.

## Lessons Learned

1. **Vision document archetypes (Educational/Infrastructure/Organizational/Creative) enable automated processing decisions.** The archetype classifier drives downstream choices -- an Educational vision generates different milestone structures than an Infrastructure vision. This avoids treating all visions identically.
2. **Cache optimization with shared load detection and schema reuse analysis reduces token costs.** The gpt-tokenizer-based token savings estimation quantifies the benefit of caching, making budget conversations concrete rather than speculative.
3. **Risk factor analysis (cache TTL, interface mismatch, model capacity) should happen at planning time, not execution time.** Identifying risks during wave planning means mitigation strategies can be built into the plan structure before any agent starts executing.

---
