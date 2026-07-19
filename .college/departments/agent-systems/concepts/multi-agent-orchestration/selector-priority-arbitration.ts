/**
 * Selector Priority Arbitration -- agent-systems concept (June-2026 arXiv cohort).
 * @module departments/agent-systems/concepts/multi-agent-orchestration/selector-priority-arbitration
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 10 * 2 * Math.PI / 47;
const radius = 0.60;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const selectorPriorityArbitration: RosettaConcept = {
  id: "agent-selector-priority-arbitration",
  name: "Selector Priority Arbitration",
  domain: 'agent-systems',
  description:
    "When several agents can each drive the shared system state, their conflicting demands are usually merged by whoever writes last or by an ad-hoc referee — opaque and non-reproducible. Borrowing from regulatory control, this primitive binds each agent to defend exactly one controlled variable and arbitrates competing demands through a structural priority network — MIN/MAX selectors plus split-range logic — so the acted-on choice is a deterministic function of current values, not of dispatch order (arXiv 2606.30877v1, 2026). The one-controlled-variable-per-loop rule makes each agent's mandate auditable, and the selector always yields to the most-constraining (safest) demand. As the wing's first arbitration primitive, it recasts conflict resolution as a fixed, inspectable control law rather than emergent negotiation — giving inter-agent conflict a provable, replayable outcome and reframing multi-agent safety as selector-network design.",
  panels: new Map(),
  relationships: [
    {
      type: "cross-reference",
      targetId: "agent-critique-and-route",
      description: "Refines critique-and-route by replacing the learned routing decision with a deterministic selector law for the specific case where agents conflict over one shared controlled variable",
    },
    {
      type: "cross-reference",
      targetId: "agent-coordination-surface",
      description: "Selector priority arbitration is a dispatch policy on the coordination surface — a structural, inspectable resolution rule the surface can host uniformly",
    },
    {
      type: "dependency",
      targetId: "agent-constraint-drift",
      description: "The one-variable-per-loop mandate and most-constraining-wins selector deterministically hold safety limits at every merge, so arbitration doubles as a constraint-drift gate",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
