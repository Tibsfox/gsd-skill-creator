/**
 * Adaptive Retrieval Stopping -- agent-systems concept (June-2026 arXiv cohort).
 * @module departments/agent-systems/concepts/agent-memory/adaptive-retrieval-stopping
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 52 * 2 * Math.PI / 47;
const radius = 0.55;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const adaptiveRetrievalStopping: RosettaConcept = {
  id: "agent-adaptive-retrieval-stopping",
  name: "Adaptive Retrieval Stopping",
  domain: 'agent-systems',
  description:
    "Iterative-retrieval agents lack a principled answer to WHEN to stop fetching: they run a fixed round count or loop until a budget drains, wasting effort on already-answered queries. A training-free stopping predicate closes this axis: halt the moment the normalized answer repeats across rounds and an isotonically-calibrated logit margin exceeds 0.25 — a single fixed threshold held constant across all 32 (model, retriever, corpus) configurations tested (arXiv 2606.13814v3, 2026). The finding (TASR) is that this repeat-plus-margin test trades small accuracy for large retrieval savings: it retains 94.8% of a fixed-k=5 policy's macro F1 at just 62.6% of its retrieval calls. Why the logit margin and not the model's own verbalized confidence? On RLHF-tuned models verbalized 1-5 confidence collapses (96.5% of values equal 5, entropy 0.182 nats), while the logit margin gives ~40x better class-conditional separation — the design is anchored in a measurable model pathology, not a hunch. Nor was the rule hand-tuned: it was the sole non-Pareto-dominated survivor of an exhaustive 381-candidate enumeration. It is the read-side counterpart to up-front depth routing — routing sets depth before retrieving; stopping reads the endpoint off the answer trajectory. Termination thus becomes a calibrated, self-monitored decision rather than a hardcoded cap, cutting cost on easy queries while preserving depth on hard ones.",
  panels: new Map(),
  relationships: [
    {
      type: "cross-reference",
      targetId: "agent-dynamic-autonomy",
      description: "Extends dynamic autonomy's trajectory-as-ledger control to the retrieval loop: instead of tightening authorization from correction history, it reads the stop point off the live answer trajectory, so loop depth is earned rather than configured.",
    },
    {
      type: "cross-reference",
      targetId: "agent-intent-routing",
      description: "The read-side complement of intent routing: routing decides retrieval depth up front, while adaptive stopping decides the endpoint online — the two together bracket a retrieval loop with a calibrated entry and exit.",
    },
    {
      type: "cross-reference",
      targetId: "agent-answer-conditioned-information-gain",
      description: "The repeat-plus-margin predicate is a cheap, training-free proxy for answer-conditioned information gain falling to zero — a stable answer signals the next round would add no decision-relevant evidence.",
    },
    {
      type: "cross-reference",
      targetId: "agent-hybrid-retrieval",
      description: "The predicate wraps whatever retriever the loop iterates, including hybrid dense-plus-lexical retrieval, treating retrieval strategy as orthogonal to the question of when iteration has converged.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
