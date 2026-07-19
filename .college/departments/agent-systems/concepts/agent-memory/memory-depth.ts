/**
 * Memory Depth -- agent-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/agent-systems/concepts/agent-memory/memory-depth
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 63 * 2 * Math.PI / 85;
const radius = 0.65;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const memoryDepth: RosettaConcept = {
  id: "agent-memory-depth",
  name: "Memory Depth",
  domain: 'agent-systems',
  description:
    "Agent memory is usually equated with access: retrieval that fetches past facts at query time. Memory Depth (arXiv 2606.26806v1) separates this from a second axis — durable, goal-conditioned tendencies written into a small parametric store rather than an external index. The paper's mechanism, EVAF, is a surprise- and valence-gated LoRA consolidation rule: only salient or goal-relevant experience triggers a parametric write, and the resulting dispositions persist after the context window is unloaded. The claim is stress-tested by the loop-drift protocol, which keeps the retrieval index fully intact while unloading working context, forcing goal-conditioned behavior to persist under long-loop interference. The two axes split cleanly: retrieval dominates shallow factual recall (short-fact accuracy 0.956–0.973), while EVAF dominates goal persistence and post-unload recovery (0.812–0.904) with only 2–3 parametric writes per 200 events. Mechanism controls further factorize selective consolidation into two independently controllable dimensions — selection (which events to write) versus actuation (how strongly the inner loop writes). For agent builders this reframes long-term memory as two mechanisms that must be engineered separately: read-side access and write-side depth, where depth buys history-shaped behavior without paying a per-query retrieval cost.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-memory-consolidation",
      description: "Specializes the parent consolidation process: depth is consolidation whose target is a small parametric store and whose gates are surprise and valence, yielding durable tendencies rather than replayable episodic records.",
    },
    {
      type: "cross-reference",
      targetId: "agent-compositional-kv-cache",
      description: "Sibling under the parametric-memory paradigm — both hold learned state in-model rather than in an external index, but depth writes goal-conditioned tendencies while the KV-cache variant caches composable activation fragments.",
    },
    {
      type: "analogy",
      targetId: "agent-in-weight-skill",
      description: "Analogous mechanism on the skill side: both fold accumulated experience into model parameters so it survives context unload, trading per-query retrieval for weight-resident behavior.",
    },
    {
      type: "cross-reference",
      targetId: "agent-hybrid-retrieval",
      description: "Represents the access half of the access-vs-depth dichotomy — hybrid retrieval fetches facts at query time, the read-side counterpart to depth's write-side parametric consolidation.",
    },
    {
      type: "cross-reference",
      targetId: "agent-experience-internalization-collapse",
      description: "The internalization-collapse warning — that agents flatten principle-level lessons into instance-level echoes — is precisely the write-admission rationale behind depth's surprise/valence gate: admitting shallow, low-surprise instances is what drives the collapse, so depth's gate is the defense the collapse concept motivates.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
