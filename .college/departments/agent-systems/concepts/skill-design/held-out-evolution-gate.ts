/**
 * Held-Out Evolution Gate concept — agent-systems skill-design wing (June-2026 additional-scan batch B, T2).
 *
 * Source: arXiv:2606.28374 (2026).
 *
 * @module departments/agent-systems/concepts/skill-design/held-out-evolution-gate
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 12 * 2 * Math.PI / 29;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const heldOutEvolutionGate: RosettaConcept = {
  id: 'agent-held-out-evolution-gate',
  name: 'Held-Out Evolution Gate',
  domain: 'agent-systems',
  description: 'A held-out evolution gate is a strict admission test for self-evolved natural-language artifacts: after an agent rewrites the state that conditions its frozen policy — a reflection, workflow, playbook, cheatsheet, or optimized prompt — the candidate is committed only if it does NOT regress on a disjoint held-out split that was never used to generate it, a keep-better rule that otherwise falls back to the last good version. In arXiv:2606.28374 (2026), RSEA (Recursive Self-Evolving Agent) carries a compact three-layer state (an imperative strategy, reusable skills, and a procedural playbook), rewrites all three from its own trajectories each generation, and gates every candidate this way. The gate is what buys monotone safety: across ALFWorld, GAIA, tau-bench, and WebShop against six baselines on one shared local backbone, RSEA never significantly underperforms the base agent and gracefully falls back to vanilla ReAct when evolved context would hurt — reaching 69.3% on ALFWorld versus 64.6% for ReAct (McNemar p=0.015), and 79.4% with retry. The contrast is Dynamic Cheatsheet, which curates context online WITHOUT a held-out gate: near-best on ALFWorld at 70.7% yet collapsing to 0.14 on WebShop (vs 0.43 for ReAct). Distinct from Capability-Controlled Self-Evolution, which bounds what an agent is permitted to modify by policy, the held-out gate places no ceiling on the edit — it empirically validates each proposed edit\'s effect on unseen tasks before commit. For agent systems this is the cheap regression harness that makes any self-improving context loop shippable: evolve freely, but let a disjoint split, not the training trajectory, decide what persists.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'agent-capability-controlled-self-evolution',
      description: 'Both make self-evolution safe, but from opposite ends: capability-controlled self-evolution restricts WHAT an agent may modify a priori, while the held-out evolution gate lets edits be arbitrary and instead validates their measured effect on an unseen split before commit.',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-building-to-the-test',
      description: 'The disjoint held-out split is the direct defense against building-to-the-test: because the artifact is never selected on the trajectories that generated it, the gate rewards genuine generalization rather than overfitting to the evolution set.',
    },
    {
      type: 'analogy',
      targetId: 'agent-self-mutating-poisoning',
      description: 'Where self-mutating poisoning shows unguarded recursive rewrites can silently degrade or corrupt an agent\'s own context, the held-out gate is the countermeasure — the unguarded Dynamic Cheatsheet collapse on WebShop is exactly the failure the gate blocks.',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-counterfactual-audit',
      description: 'Both isolate a change\'s causal effect before trusting it; counterfactual audit measures a component\'s contribution post hoc, whereas the held-out gate runs the with/without comparison at commit time as an admission condition.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
