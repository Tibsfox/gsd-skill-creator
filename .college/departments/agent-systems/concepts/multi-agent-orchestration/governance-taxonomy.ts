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
    "Task-oriented multi-agent coordination verifies only that work got done — it cannot tell whether a community of agents is actually governed. arXiv 2606.31498v1 introduces a six-dimension governance taxonomy — membership, deliberation, voting, dissent preservation, human escalation, and audit/replay — and scores agent-interoperability protocols against it. Its insight: compliance auditing is just one axis; a governed community also needs controlled membership, structured deliberation, explicit voting, preserved minority dissent, and human-escalation paths. This gives builders a checklist separating a legitimate agent polity from a swarm that merely finishes tasks.",
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
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
