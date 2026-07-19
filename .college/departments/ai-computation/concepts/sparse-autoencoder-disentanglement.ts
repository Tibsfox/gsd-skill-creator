/**
 * Sparse Autoencoder Disentanglement concept -- dictionary learning over embedding superposition.
 *
 * A top-k sparse autoencoder decomposes superposed dense-embedding features into
 * human-interpretable semantic, syntactic, and pragmatic concepts; clamping an
 * individual latent feature then steers and re-ranks retrieval (arXiv 2607.00023).
 *
 * @module departments/ai-computation/concepts/sparse-autoencoder-disentanglement
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~8*2pi/23, radius ~0.84 (mechanistic interpretability, abstract)
const theta = 8 * 2 * Math.PI / 23;
const radius = 0.84;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const sparseAutoencoderDisentanglement: RosettaConcept = {
  id: 'ai-computation-sparse-autoencoder-disentanglement',
  name: 'Sparse Autoencoder Disentanglement',
  domain: 'ai-computation',
  description: 'Dense embeddings pack many features into few dimensions by superposition, so no single ' +
    'axis is interpretable. A top-k sparse autoencoder learns an overcomplete dictionary in which each ' +
    'latent activates rarely and aligns with a human-readable concept — semantic, syntactic, or ' +
    'pragmatic — recovering interpretable directions from the superposed representation (arXiv ' +
    '2607.00023, 2026). Because each concept is now a named latent, clamping or ablating one feature ' +
    'becomes a precise intervention: it steers generation and re-ranks retrieval along a single ' +
    'interpretable axis rather than an opaque embedding shift.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'ai-computation-local-linearity-steering',
      description: 'The SAE latents are steerable directions; clamping a single interpretable feature is a local-linearity steering intervention with a named, sparse target',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-semantic-channel',
      description: 'Disentanglement splits the semantic channel into separable semantic/syntactic/pragmatic sub-features rather than one entangled bundle',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-attention-readout-gap',
      description: 'Both are mechanistic-interpretability probes: the readout gap localizes a decision fault, sparse-autoencoder disentanglement localizes and names the feature directions themselves',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
