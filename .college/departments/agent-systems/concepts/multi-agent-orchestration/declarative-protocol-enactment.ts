/**
 * Declarative Protocol Enactment -- agent-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/agent-systems/concepts/multi-agent-orchestration/declarative-protocol-enactment
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 54 * 2 * Math.PI / 85;
const radius = 0.55;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const declarativeProtocolEnactment: RosettaConcept = {
  id: "agent-declarative-protocol-enactment",
  name: "Declarative Protocol Enactment",
  domain: 'agent-systems',
  description:
    "Classic multi-agent systems bake each interaction protocol — contract-net bidding, auctions, blackboards — into bespoke, protocol-specific agent code, so adding or combining coordination patterns means rewriting agents. Ahoy (arXiv 2606.05390v2) instead expresses protocols as declarative, reusable specifications and lets an LLM agent dynamically select and enact the appropriate protocol(s) at runtime to achieve a user goal — programming-free, with no specialized training — running several concurrently when the goal decomposes. Coordination logic becomes data the agents interpret rather than code they embed, so new coordination patterns are composed at runtime instead of programmed ahead of time.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-coordination-surface",
      description: "Specializes the abstract coordination surface into a concrete mechanism: instead of fixed wiring, the surface is instantiated at runtime by an LLM that selects and enacts declarative protocol specifications, so the coordination structure is chosen per-goal rather than hard-coded.",
    },
    {
      type: "analogy",
      targetId: "agent-declarative-agent-control",
      description: "Shares the same declarative stance — behavior expressed as interpreted specifications rather than imperative code — but applies it to inter-agent interaction protocols instead of single-agent control flow, making the two adjacent members of a declarative-agent family.",
    },
    {
      type: "dependency",
      targetId: "agent-semantic-concurrency-control",
      description: "Enacting multiple protocols concurrently to satisfy one goal requires deciding which parallel interactions can safely proceed and which conflict; that arbitration is exactly the semantic concurrency control this concept depends on for correct concurrent enactment.",
    },
    {
      type: "cross-reference",
      targetId: "agent-loop-specification",
      description: "Both treat orchestration as a declarative artifact interpreted at runtime — a loop spec captures iterative control structure while a protocol grammar captures interaction structure — so the two compose as complementary declarative primitives for agent execution.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
