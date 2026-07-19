/**
 * Voronoi Retrieval Bottleneck concept -- a hard geometric capacity limit on dense retrieval.
 *
 * Single-inner-product dense retrieval has a fixed-dimension capacity ceiling:
 * its Voronoi complexity equals the sign-rank of the query-document relevance
 * matrix, so a label-free Capacity Utilization Score predicts per-query retrieval
 * failure before any training (arXiv 2606.28359v1).
 *
 * @module departments/ai-computation/concepts/voronoi-retrieval-bottleneck
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~11*2pi/23, radius ~0.88 (representational capacity theory, abstract)
const theta = 11 * 2 * Math.PI / 23;
const radius = 0.88;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const voronoiRetrievalBottleneck: RosettaConcept = {
  id: 'ai-computation-voronoi-retrieval-bottleneck',
  name: 'Voronoi Retrieval Bottleneck',
  domain: 'ai-computation',
  description: 'Dense retrieval that scores a query against documents by a single inner product has a ' +
    'hard, dimension-bounded capacity limit: the number of distinct relevance patterns it can realize ' +
    '— its Voronoi complexity — equals the sign-rank of the target relevance matrix at fixed embedding ' +
    'dimension (arXiv 2606.28359v1, 2026). When the task demands more distinct patterns than the ' +
    'dimension affords, no amount of training can fit them. The result yields a label-free Capacity ' +
    'Utilization Score that predicts per-query retrieval failure a priori — flagging unservable ' +
    'queries at AUC above 0.8 with no relevance labels — turning a representational ' +
    'ceiling into an actionable diagnostic before compute is spent.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'ai-computation-semantic-channel',
      description: 'The Voronoi/sign-rank ceiling is the capacity of the retrieval channel: a fixed embedding dimension caps how many distinct relevance patterns the semantic channel can carry',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-hyperbolic-retrieval-geometry',
      description: 'Two representational limits of dense retrieval: hyperbolic geometry fixes a curvature mismatch, the Voronoi bottleneck bounds capacity even when geometry is right',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-grounding-faithfulness',
      description: 'A per-query capacity-utilization score predicts when retrieval will fail to surface the right evidence, upstream of any grounding-faithfulness measurement on the answer',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
