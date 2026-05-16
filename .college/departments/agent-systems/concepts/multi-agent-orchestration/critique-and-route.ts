import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const critiqueAndRoute: RosettaConcept = {
  id: 'agent-critique-and-route',
  name: 'Critique-and-Route',
  domain: 'agent-systems',
  description:
    'A finite-horizon MDP controller that replaces one-shot dispatch in a multi-agent system. Each step the controller ' +
    "looks at the current draft output (not a prediction over it), critiques it against the task brief, and routes the " +
    'next action — re-prompt the same agent, delegate to a different one, ask for clarification, or terminate. The ' +
    '2026 framing (Fang et al., arxiv `2605.08686`) shows that critique-and-route dominates fixed pipelines on ' +
    'long-horizon tasks where the right delegation order depends on what was actually produced so far, not what was ' +
    "predicted to be produced. The controller is the multi-agent instantiation of the route-before-act principle; " +
    'the routing signal is the draft output itself (Theme E: execution-grounded everything).',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'agent-intent-routing',
      description: 'Critique-and-route is multi-agent intent routing — the routing happens at every controller step',
    },
    {
      type: 'cross-reference',
      targetId: 'rosetta-execution-grounded-selection',
      description: 'The critique signal is the draft output itself — execution-grounded selection at the controller level',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-coordination-surface',
      description: 'The controller is the executive layer of the coordination surface',
    },
  ],
  complexPlanePosition: {
    real: -0.5,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.25 + 0.25),
    angle: Math.atan2(0.5, -0.5),
  },
};
