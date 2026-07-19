/**
 * Hierarchical Memory Navigation -- agent-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/agent-systems/concepts/agent-memory/hierarchical-memory-navigation
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 58 * 2 * Math.PI / 85;
const radius = 0.75;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const hierarchicalMemoryNavigation: RosettaConcept = {
  id: "agent-hierarchical-memory-navigation",
  name: "Hierarchical Memory Navigation",
  domain: 'agent-systems',
  description:
    "Consolidating agent experience into flat summaries or embeddings discards the temporal and causal structure later reasoning needs, and lossy compression cannot be reversed once a summary proves too coarse. HORMA (arXiv 2606.11680) organizes memory as a file-system-like hierarchy: summarized entities sit at the top holding pointers down to the raw trajectories they abstract. Retrieval navigates top-down, drilling into detail only where a task demands it, so nothing is destroyed at write time. An agent can reason over compact overviews yet recover exact evidence, chronology, and cause-effect links on demand — the read-time analog of paging through a memory hierarchy instead of pre-summarizing everything away.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-memory-consolidation",
      description: "Specializes consolidation: rather than compressing traces into lossy summaries, it keeps each summary as a navigable pointer back to the raw trajectory, making consolidation reversible and detail-preserving instead of destructive.",
    },
    {
      type: "cross-reference",
      targetId: "agent-content-addressed-storage",
      description: "Depends on addressable references so every summarized node can link back to the exact raw trajectory it abstracts — the storage mechanism that makes top-down drill-down possible without duplicating content.",
    },
    {
      type: "cross-reference",
      targetId: "agent-memory-depth",
      description: "Both govern how far retrieval descends into a record; hierarchical navigation turns depth into an explicit dial, moving from overview to raw evidence only when the task requires that granularity.",
    },
    {
      type: "analogy",
      targetId: "agent-hybrid-retrieval",
      description: "Navigate-then-drill resembles pairing a coarse index pass with fine-grained retrieval, except the levels are explicit hierarchy nodes traversed in sequence rather than heterogeneous scores fused into one ranked list.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
