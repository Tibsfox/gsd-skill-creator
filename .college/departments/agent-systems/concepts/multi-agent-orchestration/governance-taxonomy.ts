/**
 * Governance Taxonomy -- agent-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/agent-systems/concepts/multi-agent-orchestration/governance-taxonomy
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 47 * 2 * Math.PI / 85;
const radius = 0.55;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const governanceTaxonomy: RosettaConcept = {
  id: "agent-governance-taxonomy",
  name: "Governance Taxonomy",
  domain: 'agent-systems',
  description:
    "Task-oriented multi-agent coordination verifies only that work got done — it cannot tell whether a community of agents is actually governed. arXiv 2606.31498v1 introduces a six-dimension governance taxonomy — membership, deliberation, voting, dissent preservation, human escalation, and audit/replay — and scores five agent-interoperability protocols (MCP, A2A, ACP, ANP, ERC-8004) against it, classifying each capability as Supported, Partial, or Absent. The gap matrix's headline finding: voting and dissent preservation are universally absent across all five protocols, deliberation is absent or at most partial, and no protocol encodes the full set of primitives a governed community needs. The paper then splits extensible gaps (closable through a protocol's own extension mechanisms) from structural gaps (requiring new architecture), concluding that agent-community governance is a missing architectural LAYER above today's interoperability standards — not a missing feature within them. This gives builders both a checklist separating a legitimate agent polity from a swarm that merely finishes tasks, and a warning about which primitives cannot simply be bolted on.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-compliance-trace-check",
      description: "Generalizes the parent: compliance-trace-check's audit-a-trace-against-rules is exactly the audit/replay dimension — one of six axes in this broader governance taxonomy rather than the whole picture of what makes a community governed.",
    },
    {
      type: "cross-reference",
      targetId: "agent-coordination-surface",
      description: "The taxonomy's central claim is drawing the line between a governed agent community and the mere task coordination surface this concept models; the six dimensions are what that surface lacks.",
    },
    {
      type: "cross-reference",
      targetId: "agent-declarative-protocol-enactment",
      description: "The taxonomy is applied to evaluate agent-interoperability protocols; protocol enactment is the mechanism whose membership, voting, and escalation properties actually get scored against the six dimensions.",
    },
    {
      type: "analogy",
      targetId: "agent-persistent-decision-history",
      description: "Its dissent-preservation and audit/replay dimensions mirror a persistent decision history — retaining minority positions and replayable records instead of collapsing everything to final outcomes.",
    },
    {
      type: "cross-reference",
      targetId: "agent-constraint-drift",
      description: "Both treat governance as maintained, auditable execution state rather than a one-time check: constraint-drift tracks whether an agent still honors its constraints over time, while this taxonomy's membership and audit/replay dimensions demand that a community's governance state stay live and inspectable.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
