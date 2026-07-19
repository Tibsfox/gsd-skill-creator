/**
 * Lexical Density Limit concept -- information density as a third context-window limiter.
 *
 * Beyond raw length and needle position, the rate at which a context introduces
 * distinct information (lexical density) independently caps effective retrieval:
 * at fixed ~12k length and controlled needle position, high density drives a sharp
 * retrieval collapse below 60% (arXiv 2606.06203v1).
 *
 * @module departments/ai-computation/concepts/lexical-density-limit
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~5*2pi/23, radius ~0.80 (RAG limiter, mid-abstract)
const theta = 5 * 2 * Math.PI / 23;
const radius = 0.80;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const lexicalDensityLimit: RosettaConcept = {
  id: 'ai-computation-lexical-density-limit',
  name: 'Lexical Density Limit',
  domain: 'ai-computation',
  description: 'The effective context window is limited not only by length and by where the target ' +
    'sits (lost-in-the-middle) but by lexical density — the rate at which the context introduces ' +
    'distinct information. Holding length fixed at ~12k tokens and controlling needle position, ' +
    'dense contexts drive a sharp retrieval collapse below 60% across open-weight models spanning ' +
    '9B to 685B parameters (arXiv 2606.06203v1, 2026), so the effect is not a small-model artifact. ' +
    'Crucially the study also varies density WITHIN each benchmark while holding length, needle ' +
    'position, and task type fixed, and finds that reducing density restores performance — ' +
    'upgrading the finding from a correlation to a controlled causal axis. By ' +
    'measuring density at identical length and position, the result isolates information density as ' +
    'an independent failure axis distinct from context-length dilution, teaching the clean claim ' +
    'that dense contexts are hard contexts even when they are not long ones.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'ai-computation-semantic-channel',
      description: 'Lexical density is the input rate on the semantic channel: too high a rate of distinct information saturates the channel and collapses retrieval, independent of message length',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-response-semantic-drift',
      description: 'Dense contexts degrade downstream response fidelity; the density limit names a controllable cause upstream of the semantic drift measured at the output',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-rate-distortion-deductive-source',
      description: 'Both are rate-distortion views: the density limit is where the information rate of the context exceeds what the model can losslessly attend to and retrieve',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
