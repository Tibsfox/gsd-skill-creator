/**
 * Cost-Aware Evidence Selection -- ai-computation concept (June-2026 arXiv additional scan, T2).
 * @module departments/ai-computation/concepts/cost-aware-evidence-selection
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 24 * 2 * Math.PI / 23;
const radius = 0.8;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const costAwareEvidenceSelection: RosettaConcept = {
  id: "ai-computation-cost-aware-evidence-selection",
  name: "Cost-Aware Evidence Selection",
  domain: 'ai-computation',
  description:
    "Cost-Aware Evidence Selection reframes retrieval-augmented generation as a budgeted acquisition problem: rather than treating external knowledge as free, it assigns retrieved evidence to access-cost tiers (paywalled, licensed, restricted) and forces a system to answer under an explicit evidence-access budget (arXiv 2606.02245, 2026). Instantiated by augmenting MS MARCO v2.1 with access-friction tiers across general-domain and domain-specific QA, it shows that static selection is brittle: no fixed selector uniformly dominates, and larger budgets do not reliably improve answer quality even when costly evidence is domain-matched. Its distinct contribution is recasting the LLM as an adaptive evidence-acquisition controller that decides when to retrieve, which tier to access, and when to stop. For agent systems, this implies retrieval policy should be dynamic and budget-conditioned rather than a fixed top-k pull, though such agentic control remains highly model- and task-dependent. The work is posed as an open challenge for next-generation RAG rather than a solved method, so its durable contribution is a problem formulation — budgeted evidence acquisition — more than a technique.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "ai-computation-calibrated-retrieval-budget",
      description: "Cost-aware evidence selection presupposes a calibrated retrieval budget and extends it by pricing each source into access-cost tiers so the agent spends the budget on which evidence to fetch, not merely how much.",
    },
    {
      type: "cross-reference",
      targetId: "ai-computation-matched-evidence-utilization",
      description: "Both examine whether domain-matched evidence actually pays off; cost-aware selection sharpens the concern by finding that even costly, domain-matched sources fail to reliably improve answers, echoing gaps in matched-evidence utilization.",
    },
    {
      type: "cross-reference",
      targetId: "ai-computation-utilization-accuracy-gap",
      description: "The observation that larger evidence-access budgets do not translate into better answers is a budgeted instance of the utilization-accuracy gap, where acquiring more usable evidence does not monotonically raise task accuracy.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
