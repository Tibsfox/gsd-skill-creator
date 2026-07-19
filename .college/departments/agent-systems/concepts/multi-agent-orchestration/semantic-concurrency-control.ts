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
    "When several agents write shared state—a git tree, a cluster config, a shared document—the classical database toolkit offers two moves: pessimistic locks that serialize access, or optimistic concurrency control (OCC) that races transactions and aborts-and-retries the loser on conflict. CoAgent (arXiv 2606.15376v1, 2026) argues both break for minutes-long agent transactions: a lock stalls a long inference interval, and an OCC abort discards a costly LLM run. Its protocol, MTPO (Monotonic Trajectory Pre-Order), makes control advisory rather than blocking—the runtime informs, the agent repairs. MTPO has four moving parts: it fixes a serialization pre-order at launch; serves each read the order-filtered value consistent with that order; applies writes speculatively in place on the live state; and, when a later write invalidates an earlier reader, sends that reader a one-way notification to re-judge and patch its plan, while the framework mechanically undoes and reorders misplaced writes through the saga-style inverse that each footprint-declared tool registers in advance. At quiescence the run is serializable in the pre-decided order. Realized as CoAgent toolcall middleware whose privileged ToolSmith grows undoable tools online, it stays within 5% of serial correctness at a 1.4x speedup and near-serial token cost where 2PL and OCC surrender their concurrency gains; on a bash-only target it grew a 25-tool library online and lifted the task pass rate from 45/71 to 63/71. The lesson for system builders: treat conflict not as a lock on bytes but as a judgment the affected agent makes after the fact, once the runtime has supplied a serialization order and mechanical reversibility.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-coordination-surface",
      description: "Refines the coordination surface by specifying how concurrent writes to shared state are reconciled—replacing the surface's implicit locks with MTPO's advisory control: a launch-time serialization order, order-filtered reads, speculative in-place writes, and a re-judge notification that lets the affected agent repair its plan.",
    },
    {
      type: "cross-reference",
      targetId: "agent-selector-priority-arbitration",
      description: "Both resolve contention, but priority arbitration decides by a fixed precedence order while semantic concurrency control fixes a serialization pre-order and then lets an affected agent re-judge and repair its plan when a speculative write invalidates it.",
    },
    {
      type: "cross-reference",
      targetId: "agent-harness-as-substrate",
      description: "The shared state under contention—git tree, cluster, document—is the harness substrate, and this concept governs how simultaneous agent writes to that live substrate are ordered, applied speculatively in place, and reversed via saga-style inverse tools.",
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
