/**
 * Multi Order Communication -- agent-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/agent-systems/concepts/multi-agent-orchestration/multi-order-communication
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 65 * 2 * Math.PI / 85;
const radius = 0.75;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const multiOrderCommunication: RosettaConcept = {
  id: "agent-multi-order-communication",
  name: "Multi Order Communication",
  domain: 'agent-systems',
  description:
    "Standard multi-agent graph design tunes topology—who talks to whom—while treating edge messages as fixed. In sparse or deep graphs, a decisive insight held by one agent is diluted or averaged away as it hops through intermediaries. Multi-Order Communication (MOC, 2026) instead optimizes what propagates: it aggregates neighbor evidence across multiple hops (orders) and consolidates the resulting messages so high-value signal is amplified rather than washed out. Treating message content as a first-class, learnable axis—orthogonal to topology—improves collective reasoning without adding edges or agents, which matters when scaling teams whose decisive knowledge is unevenly distributed.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-coordination-surface",
      description: "Specializes the coordination surface: where the parent frames the inter-agent link structure as the tunable object, MOC fixes topology and instead makes the content propagating along those links the optimization target, exposing a second design axis on the same surface.",
    },
    {
      type: "cross-reference",
      targetId: "agent-spectral-topology",
      description: "Complementary axis of coordination design—spectral-topology ranks and optimizes the graph structure itself, whereas MOC optimizes the message content flowing over a given structure; together they cover the topology and content halves of team design.",
    },
    {
      type: "cross-reference",
      targetId: "agent-latent-agent-communication",
      description: "Both concern what actually flows on edges rather than the wiring: latent communication changes the representation exchanged between agents, while MOC changes how multi-hop neighbor evidence is aggregated and consolidated before it is exchanged.",
    },
    {
      type: "analogy",
      targetId: "agent-long-range-dependency",
      description: "Multi-hop aggregation to keep a decisive signal from being diluted across intermediaries mirrors capturing long-range dependencies—both counter information decay over distance in a structured space rather than adding capacity.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
