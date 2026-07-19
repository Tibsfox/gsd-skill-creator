/**
 * Semantic Concurrency Control -- agent-systems concept (June-2026 arXiv cohort).
 * @module departments/agent-systems/concepts/multi-agent-orchestration/semantic-concurrency-control
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 3 * 2 * Math.PI / 47;
const radius = 0.55;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const semanticConcurrencyControl: RosettaConcept = {
  id: "agent-semantic-concurrency-control",
  name: "Semantic Concurrency Control",
  domain: 'agent-systems',
  description:
    "When several agents write shared state—a git tree, a cluster config, a shared document—the classical database toolkit offers two moves: pessimistic locks that serialize access, or optimistic concurrency control (OCC) that races transactions and aborts-and-retries the loser on conflict. CoAgent (arXiv 2606.15376v1, 2026) argues both break for minutes-long agent transactions: an abort discards a costly LLM run, and most detected conflicts are syntactic byte-overlaps that are not semantically real. The 2026 move is to let each agent's own model adjudicate whether two writes genuinely conflict, merging when intents are compatible and escalating only when they truly collide. This reframes concurrency control along a new axis—lock, abort-retry, or semantic adjudication—and tells system builders to treat conflict as a judgment about meaning rather than a lock on bytes.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-coordination-surface",
      description: "Refines the coordination surface by specifying how concurrent writes to shared state are reconciled—replacing the surface's implicit locks with model-judged semantic adjudication of whether a conflict is real.",
    },
    {
      type: "cross-reference",
      targetId: "agent-selector-priority-arbitration",
      description: "Both resolve contention, but priority arbitration decides by a fixed precedence order while semantic concurrency control asks each agent's model whether the competing writes actually collide.",
    },
    {
      type: "cross-reference",
      targetId: "agent-harness-as-substrate",
      description: "The shared state under contention—git tree, cluster, document—is the harness substrate, and this concept governs how simultaneous agent writes to that substrate are merged or escalated.",
    },
    {
      type: "analogy",
      targetId: "agent-episode-package",
      description: "The minutes-long transaction whose abort is ruinously expensive is an episode package, which is why discard-and-retry OCC is the wrong cost model for agent work.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
