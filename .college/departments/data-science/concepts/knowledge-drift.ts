/**
 * Knowledge Drift concept -- misinformation-induced belief shift in LLMs.
 *
 * Fastowski et al. (2024) studied how exposure to misinformation during
 * fine-tuning or RAG injection causes LLMs to shift factual beliefs,
 * producing +56.6% overconfidence and -52.8% uncertainty swings.
 *
 * @module departments/data-science/concepts/knowledge-drift
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~5*2pi/23, radius ~0.68 (causal mechanism, abstract-leaning)
const theta = 5 * 2 * Math.PI / 23;
const radius = 0.68;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const knowledgeDrift: RosettaConcept = {
  id: 'data-science-knowledge-drift',
  name: 'Knowledge Drift',
  domain: 'data-science',
  description: 'Knowledge drift describes the systematic shift in an LLM\'s ' +
    'stored factual beliefs caused by training on stale or misleading data. ' +
    'Fastowski et al. (2024) demonstrated that misinformation injection during ' +
    'fine-tuning produces asymmetric confidence swings: +56.6% overconfidence ' +
    'on injected false facts and -52.8% uncertainty on displaced true facts. ' +
    'Unlike semantic drift (output-level), knowledge drift is latent in the ' +
    'model weights and requires probing (activation-delta methods, factual ' +
    'recall benchmarks) to surface.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'data-science-semantic-drift',
      description: 'Knowledge drift in weights manifests as semantic drift at output time; measuring SD score is one way to detect knowledge drift effects',
    },
    {
      type: 'cross-reference',
      targetId: 'data-science-drift-detection',
      description: 'D3Bench and DriftLens provide the benchmark infrastructure for quantifying knowledge-drift magnitude in production pipelines',
    },
    {
      type: 'dependency',
      targetId: 'data-algorithmic-bias',
      description: 'Misinformation-induced knowledge drift is a specific form of training-data bias that propagates into model output',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
