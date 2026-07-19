/**
 * Index Side Reasoning -- agent-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/agent-systems/concepts/agent-memory/index-side-reasoning
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 60 * 2 * Math.PI / 85;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const indexSideReasoning: RosettaConcept = {
  id: "agent-index-side-reasoning",
  name: "Index Side Reasoning",
  domain: 'agent-systems',
  description:
    "Standard retrieval reasons over relations at query time — expanding, chaining, or rewriting the query per request — which is slow and repeats the same relational work on every hit. RL-Index (arXiv:2606.16316) reframes index construction as a reinforcement-learning problem: instead of reasoning at query time, it augments each document with LLM-generated rationales that make the latent query-knowledge relationship explicit, training that rationale augmentation with Group Relative Policy Optimization (GRPO) using retrieval similarity as a verifiable reward. At serving time the query path stays cheap because the hard relational reasoning was already baked into the per-document rationales rather than recomputed per query. On the BRIGHT benchmark this improves both retrieval and downstream question-answering while significantly cutting online latency, and the learned rationale augmentation is plug-and-play — it generalizes across different retrievers and generators. For agent memory this decouples expensive multi-hop reasoning from latency-sensitive recall, letting a large corpus be pre-reasoned once and queried cheaply many times.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-hybrid-retrieval",
      description: "Specializes hybrid retrieval by moving the relational/implicit-relation reasoning off the query path: instead of blending lexical, dense, and graph signals at read time, it precomputes those cross-document links offline into the index build, so the parent's fusion step operates over an already-reasoned corpus.",
    },
    {
      type: "analogy",
      targetId: "agent-memory-consolidation",
      description: "Both perform offline reorganization of stored knowledge rather than at read time — consolidation compresses and restructures session traces into durable memory, while index-side reasoning materializes implicit relations into the index; each front-loads work so recall stays cheap.",
    },
    {
      type: "cross-reference",
      targetId: "agent-admission-time-hubness-gate",
      description: "Shares the write/index-construction phase as its locus of control: the hubness gate governs which records may enter vector memory at admission time, and index-side reasoning governs what relational structure is baked in at build time — both act before any query arrives.",
    },
    {
      type: "cross-reference",
      targetId: "agent-query-aware-graph-traversal",
      description: "The query-time counterpart it contrasts against: query-aware traversal computes relational paths dynamically per request, whereas index-side reasoning precomputes those paths offline, trading index-build cost for a faster, reasoning-free serving path.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
