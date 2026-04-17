# Retrospective — v1.49.15

## What Worked

- **Pure scoring functions (scoreNode, rankNodes, selectWithFallback) make routing testable.** By separating the scoring logic from the dispatch mechanism, the mesh routing can be unit tested without spinning up actual LLM providers. This is the functional core / imperative shell pattern applied to multi-model orchestration.
- **5-phase decomposition mirrors a real network stack.** Abstraction -> Evaluation -> Infrastructure -> Orchestration -> Integration follows the same layering as TCP/IP: each phase depends only on the one below it. 594 new tests across 98 files confirm the layers compose correctly.
- **Fidelity-adaptive compression in DACP Transport.** Context transfer across mesh boundaries preserves quality by adjusting compression based on the target model's capability. This is a non-obvious design decision that prevents quality degradation during model handoff.
- **Automatic failover with fan-out dispatch.** MeshCoordinator handles dispatch, fan-out, pipeline, and failover as first-class operations. The mesh doesn't just route -- it recovers.

## What Could Be Better

- **~17,400 LOC is the largest single-milestone code addition in the v1.49.x series.** The mesh architecture is comprehensive but the volume means significant surface area to maintain. The abstraction layer (chip drivers, registry) is the most likely to need updates as LLM provider APIs evolve.
- **Cost-aware routing is mentioned but details are thin.** The scoring functions enable cost-aware selection, but the actual cost models for different providers aren't documented in the release notes.

## Lessons Learned

1. **Multi-model mesh architecture requires a model abstraction layer before anything else.** Chip drivers for OpenAI-compatible and Anthropic endpoints normalize the interface so routing, evaluation, and failover can be provider-agnostic.
2. **Context preservation across mesh boundaries is the hard problem.** Transcript summarization with fidelity-adaptive compression is a trade-off between context length and quality. Getting this wrong means models operate with degraded context after handoff.
3. **MCP infrastructure (queuing, timeout, health monitoring, stale eviction) is unglamorous but essential.** Without per-chip queuing and health probing, the mesh degrades silently under load.
