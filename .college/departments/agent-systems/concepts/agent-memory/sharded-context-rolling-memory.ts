/**
 * Sharded-Context Rolling Memory -- agent-systems concept (June-2026 arXiv additional scan, T2).
 * @module departments/agent-systems/concepts/agent-memory/sharded-context-rolling-memory
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 121 * 2 * Math.PI / 47;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const shardedContextRollingMemory: RosettaConcept = {
  id: "agent-sharded-context-rolling-memory",
  name: "Sharded-Context Rolling Memory",
  domain: 'agent-systems',
  description:
    "Sharded-Context Rolling Memory addresses the \"Lost in Conversation\" failure, where an LLM's accuracy collapses—by up to 65%—once task-critical details are disclosed piecemeal across turns, even though the full history remains in context (arXiv 2606.12941, 2026). Rather than attending to an ever-growing transcript, the model is trained to maintain a compact rolling memory it updates incrementally. Its distinct contribution is a low-cost sharding pipeline that fragments existing single-turn QA datasets into multi-turn, information-scattered episodes, removing the manual-annotation bottleneck. Trained only on sharded GSM8K, the memory-augmented policy raises multi-turn accuracy and transfers zero-shot to harder math and out-of-domain long-context QA. Memory-trained models beat full-history baselines even when handed the full history, implying that learning to compress yields more robust incremental reasoning. For agent design, it argues bounded, actively-maintained state outperforms unbounded context accumulation.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-single-token-memory-compression",
      description: "Rolling memory rests on the same compress-don't-accumulate principle as single-token memory compression, learning to fold each turn's task-critical detail into a compact state instead of re-reading the whole transcript.",
    },
    {
      type: "cross-reference",
      targetId: "agent-long-range-dependency",
      description: "The Lost-in-Conversation collapse it repairs is precisely a long-range-dependency failure—facts revealed many turns apart must be bound together—so rolling memory is a training-time mechanism for resolving such dependencies.",
    },
    {
      type: "analogy",
      targetId: "agent-submodular-context-selection",
      description: "Like submodular context selection, it forgoes the full growing history for a bounded, high-value working set, but achieves the compaction through learned incremental updates rather than an explicit selection objective.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
