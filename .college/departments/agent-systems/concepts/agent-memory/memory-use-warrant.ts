/**
 * Memory-Use Warrant -- agent-systems concept (June-2026 arXiv cohort).
 * @module departments/agent-systems/concepts/agent-memory/memory-use-warrant
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 80 * 2 * Math.PI / 47;
const radius = 0.75;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const memoryUseWarrant: RosettaConcept = {
  id: "agent-memory-use-warrant",
  name: "Memory-Use Warrant",
  domain: 'agent-systems',
  description:
    "A retrieved memory can be perfectly on-topic yet still be wrong to surface — recalling a user's sensitive disclosure into an unrelated turn is a relevance hit but an appropriateness miss. The 2026 finding (arXiv 2606.06055v1, 2026) frames this as a warrant decision: WHETHER to integrate long-term memory into the current turn is a gate separate from how accurately it was retrieved, and relevance does not imply appropriateness. It is made measurable by RBI-Eval, a probe set that compares a model's behavior with and without access to sensitive memory under identical benign prompts, scored against a matched no-memory reference. The divergence is large and model-dependent: with memory available the separation score for sensitive-memory integration drops only 8.9–26.6% for GPT-5.4-mini but 51.1–82.9% for Claude-Sonnet-4.6, DeepSeek-V4-Flash, and Qwen3.5-9B. Control experiments (DeepSeek, GPT-5.4-mini) confirm the effect is specific to sensitive content, not general personalization. Crucially the gate is needed at both retrieval and generation time: retrieval systems reduce exposure but do not eliminate integration once sensitive memory reaches the generator. Appropriateness thus becomes a first-class axis: a memory subsystem needs a policy that can decline a correctly-retrieved item, not just a retriever that ranks well.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-intent-routing",
      description: "Extends intent routing with a downstream read-side gate: routing decides what/how to fetch, while the warrant decides WHETHER a correctly-fetched memory should be integrated — an appropriateness axis orthogonal to the retrieval decision.",
    },
    {
      type: "cross-reference",
      targetId: "agent-hybrid-retrieval",
      description: "Hybrid retrieval optimizes retrieval accuracy (getting the right item); the warrant is the separate gate that can still decline a correctly-retrieved item, making explicit that accuracy and appropriateness are distinct objectives.",
    },
    {
      type: "cross-reference",
      targetId: "agent-decision-aware-context-selection",
      description: "Both are read-side gates on what enters the current turn; decision-aware selection admits context by downstream utility, whereas the warrant admits or blocks it by appropriateness, especially for sensitive content.",
    },
    {
      type: "analogy",
      targetId: "agent-skill-privilege-boundary",
      description: "Same appropriateness-gate family: a privilege boundary constrains what a skill may access, while the warrant constrains whether recalled sensitive memory may be used — permission logic rather than similarity ranking.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
