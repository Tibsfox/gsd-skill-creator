/**
 * Response Semantic Drift concept -- diffusion-LM RAG output divergence.
 *
 * RSD (2026) characterized how diffusion-based language model RAG pipelines
 * accumulate response-level semantic drift when retrieved context passages
 * have diverged from the parametric knowledge distribution.
 *
 * @module departments/ai-computation/concepts/response-semantic-drift
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~10*2pi/23, radius ~0.70 (retrieval system, applied)
const theta = 10 * 2 * Math.PI / 23;
const radius = 0.70;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const responseSemanticDrift: RosettaConcept = {
  id: 'ai-computation-response-semantic-drift',
  name: 'Response Semantic Drift',
  domain: 'ai-computation',
  description: 'Response Semantic Drift (RSD) quantifies the paragraph-level ' +
    'semantic divergence between a diffusion-LM RAG system\'s output and its ' +
    'retrieved context, arising when the model\'s denoising process interpolates ' +
    'between retrieved passages and parametric priors. RSD (2026) characterized ' +
    'this as a surface distinct from input-side retrieval drift: even with ' +
    'perfectly retrieved context, the diffusion decoding process can semantically ' +
    'drift toward parametric attractors, especially for topics where training ' +
    'data density is high relative to retrieval quality.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'ai-computation-grounding-faithfulness',
      description: 'RSD directly reduces SGI grounding faithfulness scores — the two metrics are measuring complementary sides of the same retrieval-generation faithfulness problem',
    },
    {
      type: 'cross-reference',
      targetId: 'adaptive-systems-context-equilibrium',
      description: 'Context equilibrium theory predicts when retrieval drift will overcome parametric attractors; RSD characterises the residual drift when equilibrium is not reached',
    },
    {
      type: 'dependency',
      targetId: 'data-science-semantic-drift',
      description: 'RSD extends the base semantic-drift framework (Spataru SD score) to the retrieval-augmented generation setting',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
