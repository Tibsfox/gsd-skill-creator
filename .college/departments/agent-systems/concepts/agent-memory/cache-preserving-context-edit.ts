/**
 * Cache-Preserving Context Edit -- agent-systems concept (June-2026 arXiv additional scan, T2).
 * @module departments/agent-systems/concepts/agent-memory/cache-preserving-context-edit
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 123 * 2 * Math.PI / 47;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const cachePreservingContextEdit: RosettaConcept = {
  id: "agent-cache-preserving-context-edit",
  name: "Cache-Preserving Context Edit",
  domain: 'agent-systems',
  description:
    "Cache-Preserving Context Edit tackles rising inference cost in long-horizon LLM agents by constraining how context is mutated so the prompt cache survives. Prior pruning and dynamic eviction shrink token footprints but perform unconstrained sequence mutations that alter layouts, causing prefix mismatches and cache invalidation — exposing a trade-off between text sparsity and prompt-cache continuity. TokenPilot (arXiv 2606.17016, 2026) manages context at dual granularity: globally, Ingestion-Aware Compaction stabilizes prompt prefixes and filters open-world environmental noise at the ingestion gate; locally, Lifecycle-Aware Eviction tracks each segment's residual utility and offloads it on a conservative batch-turn schedule only once task relevance expires. On the PinchBench and Claw-Eval benchmarks it cuts cost by 56-61% in isolated mode and by 61-87% in continuous mode while holding performance competitive with prior systems, and now ships inside LightMem2. Its distinct lesson for agent builders: context editing must respect KV-cache prefix boundaries, not merely minimize tokens — a mutation placed before the cache's divergence point invalidates every cached token downstream, so prefix POSITION, not token count, is what governs whether the savings survive or evaporate in recomputation.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-compositional-kv-cache",
      description: "TokenPilot's Ingestion-Aware Compaction stabilizes prompt prefixes precisely so the KV cache stays reusable — the same cached-segment reuse that compositional-kv-cache depends on when assembling prompts across turns.",
    },
    {
      type: "cross-reference",
      targetId: "agent-submodular-context-selection",
      description: "Lifecycle-Aware Eviction's residual-utility scoring of segments is a cache-constrained variant of utility-driven context selection, choosing what to drop under an added prefix-continuity constraint.",
    },
    {
      type: "analogy",
      targetId: "agent-single-token-memory-compression",
      description: "Both reduce token footprint, but single-token compression rewrites the sequence and breaks prefixes, whereas cache-preserving edit deliberately trades sparsity to keep the prefix — and thus the cache — intact.",
    },
    {
      type: "cross-reference",
      targetId: "agent-context-resident-state",
      description: "This concept is the HOW-to-evict-cheaply complement to the WHY-eviction-is-dangerous cluster: context-resident-state explains why dropping a still-needed block is costly, which is precisely the risk a cache-preserving edit is engineered to avoid while keeping the KV prefix intact.",
    },
    {
      type: "cross-reference",
      targetId: "agent-load-bearing-eviction",
      description: "Load-bearing-eviction names the failure mode this technique defends against — removing a block other content silently depends on. Cache-preserving context edits are the mitigation: they mutate context without invalidating the cached prefix, so eviction never becomes load-bearing damage.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
