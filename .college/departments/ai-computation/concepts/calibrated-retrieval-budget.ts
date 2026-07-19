/**
 * Calibrated Retrieval Budget -- ai-computation concept (June-2026 arXiv cohort, T2).
 * @module departments/ai-computation/concepts/calibrated-retrieval-budget
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 32 * 2 * Math.PI / 41;
const radius = 0.60;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const calibratedRetrievalBudget: RosettaConcept = {
  id: "ai-computation-calibrated-retrieval-budget",
  name: "Calibrated Retrieval Budget",
  domain: 'ai-computation',
  description:
    "Adaptive RAG usually toggles retrieval on a fixed heuristic, wasting context on queries the model already answers correctly and under-fetching on hard ones. Retrieval-budget calibration turns the model's own answer-confidence into a calibrated probability of correctness, then applies a per-query policy: answer closed-book when confidence is high, fetch a compact or full context as confidence drops, or abstain when even retrieval is unlikely to help. This resolves the intervention paradox — retrieval can lower accuracy when it displaces correct parametric knowledge — by spending tokens only where the expected correctness gain justifies them.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "intent-router",
      description: "Specializes the parent's question-KIND routing: instead of classifying what type of question this is, it gates on calibrated closed-book confidence to pick a retrieval budget (none / compact / full) or to abstain.",
    },
    {
      type: "cross-reference",
      targetId: "ai-computation-utilization-accuracy-gap",
      description: "Absorbs the intervention paradox this concept measures — retrieval can degrade answers the model would get right unaided; the calibrated confidence score is precisely the decision signal for staying closed-book.",
    },
    {
      type: "cross-reference",
      targetId: "ai-computation-grounding-faithfulness",
      description: "The compact-versus-full budget choice trades grounding depth against token cost, and abstention is the fail-closed floor invoked when no fetched context is expected to make the answer faithful.",
    },
    {
      type: "analogy",
      targetId: "ai-computation-four-tier-trust",
      description: "Both graduate an output through discrete tiers driven by a confidence-like signal rather than a binary gate — closed-book / compact / full / abstain mirrors escalating trust levels.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
