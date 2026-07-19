/**
 * Unlearning Suppression Reversal concept — ai-computation (June-2026 additional-scan batch B, T2).
 *
 * Source: arXiv:2606.03291 (2026).
 *
 * @module departments/ai-computation/concepts/unlearning-suppression-reversal
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 4 * 2 * Math.PI / 29;
const radius = 0.93;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const unlearningSuppressionReversal: RosettaConcept = {
  id: 'ai-computation-unlearning-suppression-reversal',
  name: 'Unlearning Suppression Reversal',
  domain: 'ai-computation',
  description: 'Unlearning Suppression Reversal is the finding that machine-unlearning methods, which aim to remove targeted facts from an LLM without full retraining, do not actually erase knowledge but merely suppress its expression in the network\'s later decoding layers, leaving the underlying representation recoverable. Studying multilingual unlearning by extending the TOFU benchmark to five languages, arXiv:2606.03291 (2026) fine-tunes, unlearns, and queries across language permutations and runs a layer-wise analysis showing that unlearning leaves the shared cross-lingual latent space in early layers largely intact and instead operates primarily near the output — a signature of superficial suppression rather than deletion. Because the fact still lives in the shared latent space, a single inference-time steering direction added to activations reverses much of the suppression across languages, recovering 50% of the unlearned knowledge on Qwen and 90% on Gemma; the paper also reports that unlearning transfer between languages is highly variable, strongest between languages sharing scripts and families, and that the unlearning language predicts which query languages transfer best. Distinct from Knowledge-Conflict Steering, which uses an activation direction to arbitrate between a model\'s parametric belief and external context at read time, this mechanism uses a steering direction to undo a training-time intervention, exposing that the intervention never removed the information at all. For building agent systems and LLM tooling, the implication is sobering: treating an unlearned model as genuinely scrubbed of sensitive facts (PII, credentials, copyrighted or private data) is unsafe, since a cheap inference-time nudge or a cross-lingual query can resurface it — real deletion guarantees require verifying that the early shared representation, not just the output layer, no longer encodes the target, and multilingual coverage must be audited explicitly.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'ai-computation-knowledge-conflict-steering',
      description: 'Both add a single inference-time steering direction to activations to change behavior; here the direction reverses training-time suppression rather than arbitrating parametric-vs-context conflict.',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-task-specific-knowledge-localization',
      description: 'The layer-wise finding that unlearning acts in later decoding layers while the early shared latent space stays intact is a localization result about where suppression lives versus where the knowledge is stored.',
    },
    {
      type: 'analogy',
      targetId: 'ai-computation-local-linearity-steering',
      description: 'Like local-linearity steering, a single linear direction in activation space is enough to move the model\'s output across a behavioral boundary, here restoring most of the suppressed facts.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
