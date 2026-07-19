/**
 * Compositional Behavioral Leakage -- agent-systems concept (June-2026 arXiv cohort).
 * @module departments/agent-systems/concepts/skill-design/compositional-behavioral-leakage
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 101 * 2 * Math.PI / 47;
const radius = 0.55;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const compositionalBehavioralLeakage: RosettaConcept = {
  id: "agent-compositional-behavioral-leakage",
  name: "Compositional Behavioral Leakage",
  domain: 'agent-systems',
  description:
    "When several prompt modules share one context window, they are not isolated: editing a non-focal module silently shifts a focal module's behaviour because transformer self-attention draws no boundary between concatenated instructions (Instruction Bleed / CBL). The 2026 finding (arXiv 2606.26356v1, 2026) names this cross-module interference and shows it is invisible to pass/fail metrics — a skill can bleed into a neighbour's output while every task still passes green. The implication for agent systems is that loading more skills is never free: each added module widens the attention surface over which behaviour can leak. This is a distinct failure axis from privilege isolation — a skill can respect its capability boundary yet still perturb another module's tokens. Detection is counterfactual: hold the non-focal module in versus out and diff the focal trace.",
  panels: new Map(),
  relationships: [
    {
      type: "cross-reference",
      targetId: "agent-skill-privilege-boundary",
      description: "Refines the privilege boundary by adding a second, orthogonal isolation axis: privilege governs what a module may DO, whereas behavioural leakage is interference in what a module SAYS — a skill can honour its capability boundary and still bleed into a neighbour's behaviour, so isolating privilege does not isolate behaviour.",
    },
    {
      type: "cross-reference",
      targetId: "agent-paired-trace-audit",
      description: "Paired-trace audit is the operational way to detect leakage: run the focal module with and without the non-focal module present and diff the resulting traces to surface the bleed.",
    },
    {
      type: "cross-reference",
      targetId: "agent-counterfactual-audit",
      description: "Leakage is a counterfactual-audit finding — it is precisely the presence-versus-absence delta of a non-focal module measured on a focal module's behaviour rather than on its own.",
    },
    {
      type: "cross-reference",
      targetId: "agent-silent-failure-taxonomy",
      description: "Compositional behavioural leakage is a silent failure: it changes output without tripping pass/fail metrics, so it belongs to the taxonomy of defects that green test suites cannot see.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
