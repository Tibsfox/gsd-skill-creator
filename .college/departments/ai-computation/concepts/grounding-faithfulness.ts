/**
 * Grounding Faithfulness concept -- SGI measuring RAG output-to-source fidelity.
 *
 * The Semantic Grounding Index (SGI, 2025) measures how faithfully an LLM
 * grounds its generated output in retrieved context, with Cohen's d of
 * 0.92-1.28 across grounded vs. ungrounded generation pairs.
 *
 * @module departments/ai-computation/concepts/grounding-faithfulness
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~9*2pi/23, radius ~0.73 (applied metric, moderate abstraction)
const theta = 9 * 2 * Math.PI / 23;
const radius = 0.73;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const groundingFaithfulness: RosettaConcept = {
  id: 'ai-computation-grounding-faithfulness',
  name: 'Grounding Faithfulness',
  domain: 'ai-computation',
  description: 'Grounding faithfulness measures how accurately an LLM\'s ' +
    'generated text reflects the content of retrieved context documents rather ' +
    'than leaking parametric (memorized) knowledge. The Semantic Grounding Index ' +
    '(SGI, 2025) operationalises this as a sentence-level entailment score ' +
    'between output claims and retrieved passages, reporting Cohen\'s d of ' +
    '0.92–1.28 between grounded and ungrounded generation pairs — a large ' +
    'effect size. SGI is the retrieval surface\'s primary quality metric, ' +
    'distinguishing "semantic laziness" (parametric leakage) from genuine ' +
    'source-faithful responses.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'adaptive-systems-context-equilibrium',
      description: 'Context equilibrium (Dongre 2025) describes the drift dynamics; grounding faithfulness measures whether the RAG system recovers to source-faithful output',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-response-semantic-drift',
      description: 'Response semantic drift in diffusion-LM RAG directly erodes grounding faithfulness scores when retrieval context diverges from generation',
    },
    {
      type: 'dependency',
      targetId: 'data-science-drift-detection',
      description: 'SGI score timeseries feeds drift-detection pipelines that alert when grounding faithfulness drops below operational thresholds',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
