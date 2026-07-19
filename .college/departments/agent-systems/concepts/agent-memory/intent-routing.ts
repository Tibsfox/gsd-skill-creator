import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const intentRouting: RosettaConcept = {
  id: 'agent-intent-routing',
  name: 'Intent Routing',
  domain: 'agent-systems',
  description:
    'Classify the query intent before selecting a retrieval (or reasoning) strategy. Converts retrieval from a fixed ' +
    'function into a policy: different intents (lookup vs. multi-hop vs. global summarisation vs. verification vs. deep ' +
    'reasoning) demand categorically different retrievers, context budgets, and refinement passes. LLMs possess latent ' +
    "routing ability elicitable via a structured prompt without additional training, so a single routed sample reaches " +
    "Best-of-N quality (Chen et al., arxiv 2605.10235v2 Pre-Route); externalising the routing decision across three " +
    "named tiers — Profile Lookup, Targeted Retrieval, Deep Reasoning — improves small-model performance by ~2x on a " +
    "1.7B SLM (Sharma et al. 2605.03312v1 MemFlow). The pattern recurs across every domain in the 2026 frontier — code-gen 'plan only on " +
    "verification failure' (PaT 2605.07248v1), multi-agent 'critique-and-route MDP' (2605.08686), skill-design " +
    "Probe&Prefill (2605.14038v1) — making intent routing a cross-domain primitive. Anchored at the rosetta-core " +
    "level as Concept 7.",
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'rosetta-intent-routing',
      description: 'Intent routing is canonised as Rosetta concept #7',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-critique-and-route',
      description: 'Critique-and-route is the multi-agent instantiation of the same routing principle',
    },
    {
      type: 'cross-reference',
      targetId: 'sci-specialised-composition',
      description: 'Intent routing is the upstream switch in a mixture-of-controllers (specialised composition Rosetta #5)',
    },
  ],
  complexPlanePosition: {
    real: -0.5,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.25 + 0.09),
    angle: Math.atan2(0.3, -0.5),
  },
};
