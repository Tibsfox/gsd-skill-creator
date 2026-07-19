/**
 * Retrieval Crowding Collapse concept — ai-computation (June-2026 additional-scan batch B, T2).
 *
 * Source: arXiv:2606.28343 (2026).
 *
 * @module departments/ai-computation/concepts/retrieval-crowding-collapse
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 11 * 2 * Math.PI / 29;
const radius = 0.93;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const retrievalCrowdingCollapse: RosettaConcept = {
  id: 'ai-computation-retrieval-crowding-collapse',
  name: 'Retrieval Crowding Collapse',
  domain: 'ai-computation',
  description: 'Retrieval Crowding Collapse is a mean-field, statistical-physics account of how dense retrieval systematically expels minority content from top-k results even when nothing about that content is defective. In a shared embedding space, the document density needed to serve a majority interest (generic "Crime" films) geometrically overcrowds the retrieval neighborhood of a semantically adjacent minority ("Film Noir"), so majority documents win the top-k competition even for the minority\'s own queries. arXiv:2606.28343 (2026) formalizes this two ways: a static analysis proving a phase transition at which minority-goal recall suffers a catastrophic collapse as majority density crosses a threshold, and a dynamic model deriving a non-linear Fokker-Planck equation for how document embeddings evolve when the agent updates them to maximize retrieval accuracy. The central result is that this purely local, relevance-maximizing objective triggers an emergent global mechanism: the system provably self-organizes into a state that exclusively serves majority interests, marginalizing minorities as a side effect of optimizing each query in isolation. Distinct from the Voronoi Retrieval Bottleneck, which characterizes a static, fixed-geometry capacity limit on how many neighbors a cell can serve, this concept adds the temporal dimension — a density-driven phase transition plus an update dynamic that actively drives the geometry toward collapse. It reframes retrieval fairness not as a labeling problem but as a coupled-population dynamics problem that is invisible to query-by-query evaluation. For agent systems: because minority collapse is emergent from index-wide density and reinforced by every accuracy-driven embedding refresh, per-query evaluation and per-query reranking can neither detect nor fix it; you need index-level density monitoring, minority-neighborhood reservation, or a fairness-regularized update objective that counteracts the Fokker-Planck drift before the phase transition is crossed.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'Concrete monitoring angle the theory implies: rather than evaluating recall query-by-query, compute an index-level crowding score per minority cluster. For each labeled minority centroid, count majority-document embeddings whose cosine similarity to the centroid exceeds the similarity of the minority\'s own k-th document (i.e., majority mass inside the minority\'s top-k ball). A crowding ratio approaching or exceeding 1 flags proximity to the phase transition; track it over successive embedding refreshes to detect the Fokker-Planck drift toward majority-only self-organization, and trigger minority-neighborhood reservation or a fairness-regularized re-embedding before recall collapses.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'ai-computation-voronoi-retrieval-bottleneck',
      description: 'The Voronoi Retrieval Bottleneck is the static, fixed-geometry capacity limit; Retrieval Crowding Collapse is its dynamic counterpart, adding a density-driven phase transition and a Fokker-Planck update law that actively drives the geometry toward the bottleneck rather than assuming it fixed.',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-grounding-faithfulness',
      description: 'Names the same downstream failure that Grounding Faithfulness measures — the retriever fails to surface the evidence a minority query needs — but attributes it to index-wide spatial crowding rather than to how the generator uses retrieved context.',
    },
    {
      type: 'analogy',
      targetId: 'ai-computation-categorical-prior-lock-in',
      description: 'Both describe a self-reinforcing collapse toward a dominant mode: Categorical Prior Lock-In locks a model onto a majority category prior, while crowding collapse locks the retrieval geometry into exclusively serving the majority population via a local relevance objective.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
