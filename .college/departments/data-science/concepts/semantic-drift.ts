/**
 * Semantic Drift concept -- SD score measuring long-form output drift.
 *
 * Spataru et al. (2024) introduced the SD (Semantic Drift) score as a
 * paragraph-level metric for measuring how far LLM outputs drift from
 * ground-truth facts as generation length increases.
 *
 * @module departments/data-science/concepts/semantic-drift
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~4*2pi/23, radius ~0.72 (empirical measurement, near-concrete)
const theta = 4 * 2 * Math.PI / 23;
const radius = 0.72;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const semanticDrift: RosettaConcept = {
  id: 'data-science-semantic-drift',
  name: 'Semantic Drift',
  domain: 'data-science',
  description: 'Semantic drift quantifies how far a language model\'s output ' +
    'diverges from factual ground truth as generation continues. Spataru et al. ' +
    '(2024) defined the SD score as a paragraph-level cosine-similarity decay ' +
    'metric: across major LLMs the SD score sits at 0.77–0.79, and 37% of ' +
    'paragraphs show measurable drift within the first 10% of output tokens. ' +
    'The SD score is computed against atomic facts extracted from a reference ' +
    'document, making it sensitive to both hallucination onset and topic wander.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'data-science-knowledge-drift',
      description: 'Semantic drift is the observable signal; knowledge drift is the underlying cause when model beliefs diverge from current facts',
    },
    {
      type: 'cross-reference',
      targetId: 'data-science-drift-detection',
      description: 'Drift-detection tools (DriftLens, D3Bench) operationalise SD-style metrics for production monitoring',
    },
    {
      type: 'dependency',
      targetId: 'data-measures-of-spread',
      description: 'SD score variance across LLMs requires standard spread measures (IQR, standard deviation) to interpret population-level results',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
