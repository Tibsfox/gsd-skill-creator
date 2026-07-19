/**
 * Agent Federated Skill Evolution concept — agent-systems skill-design wing (June-2026 additional-scan batch B, T2).
 *
 * Source: arXiv:2606.03143 (2026).
 *
 * @module departments/agent-systems/concepts/skill-design/federated-skill-evolution
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 20 * 2 * Math.PI / 29;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const federatedSkillEvolution: RosettaConcept = {
  id: 'agent-federated-skill-evolution',
  name: 'Agent Federated Skill Evolution',
  domain: 'agent-systems',
  description: 'Federated Skill Evolution is a privacy-preserving framework for collaborative agent self-improvement in which the unit of cross-user communication is a semantic skill diff — a structured patch over a client\'s local skill library — rather than a raw task trajectory. Because isolated single-user task streams lack the diversity needed to build comprehensive skills, FederatedSkill (arXiv:2606.03143 (2026)) lets many clients pool improvements without exposing their trajectories: each client emits structured patches describing how its library changed, a server-side evolution agent aggregates those patches, and, crucially, it dynamically models each client\'s capability boundaries so that what it returns is a strictly personalized library rather than a suboptimal global average that ignores client heterogeneity. Across 20 distinct agent task families this yields up to a 44.4% increase in success rate and a 37.5% reduction in computational cost over self-evolving baselines. Distinct from Compositional Skill Evolution, which composes new skills from existing ones inside a single agent\'s library, this mechanism\'s novelty is the federation layer itself: the diff-as-communication-unit decouples the privacy surface (never share trajectories) from the collaboration benefit (share what was learned), and server-side per-client boundary modeling resists collapsing everyone onto one mean. For building agent systems, it argues that a shared skill marketplace should exchange versioned, diffable skill patches — like git commits over a library — with a personalizing aggregator on the receiving end, instead of dumping every agent\'s raw logs into one training pool; that keeps user data local while still letting a fleet of specialized agents lift each other\'s capability frontier.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'agent-compositional-skill-evolution',
      description: 'Both grow skill libraries beyond what a single stream supplies, but Compositional Skill Evolution composes within one agent\'s library while Federated Skill Evolution federates diffs across many users\' libraries.',
    },
    {
      type: 'dependency',
      targetId: 'agent-capability-controlled-self-evolution',
      description: 'Federated evolution presupposes each client already runs a bounded self-evolution loop; the federation layer aggregates the patches those local loops produce and models per-client capability boundaries on top of them.',
    },
    {
      type: 'analogy',
      targetId: 'agent-skill-as-artifact',
      description: 'Treating the skill diff as the shared unit mirrors skills-as-artifacts: a library becomes a versioned, diffable object exchanged like git commits rather than an opaque model state.',
    },
    {
      type: "cross-reference",
      targetId: "agent-in-weight-skill",
      description: "Both concepts fix the transport/representation UNIT of a skill: federated evolution ships diff-patches while in-weight skill encodes the skill as a weight-adapter. Pairing them contrasts a text-diff unit against a parametric unit — a natural sibling comparison.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
