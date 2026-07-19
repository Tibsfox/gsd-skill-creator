/**
 * Latent Reconstruction Fidelity concept — ai-computation (June-2026 additional-scan batch B, T2).
 *
 * Source: arXiv:2606.06252 (2026).
 *
 * @module departments/ai-computation/concepts/latent-reconstruction-fidelity
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 9 * 2 * Math.PI / 29;
const radius = 0.93;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const latentReconstructionFidelity: RosettaConcept = {
  id: 'ai-computation-latent-reconstruction-fidelity',
  name: 'Latent Reconstruction Fidelity',
  domain: 'ai-computation',
  description: 'Latent Reconstruction Fidelity is a test-time self-supervision mechanism that gives opaque latent reasoning the input-anchored check that natural-language traces provide for free. When a model moves intermediate reasoning out of readable text and into latent or cache-level representations to cut token overhead, those states become uninspectable, so there is no way to tell whether a latent thought still preserves the constraints of the original query; latent reasoning therefore runs open-loop, produced and consumed with no reference back to the problem it should encode. ReLAT (Reconstruction-Guided Latent Reasoning At Test Time), from arXiv:2606.06252 (2026), closes this loop with a single observation: if a latent state faithfully represents a query, the query should be recoverable from it, and if it cannot be, the state has shed task-relevant information. It builds a differentiable Question to Latent Thought to Question cycle and, before generating an answer, optimizes a query-reconstruction loss through the latent thought, pulling the opaque computation back toward the specification it is meant to represent. Across mathematical reasoning, knowledge QA, and code generation on the Qwen family it beats single-model inference, text-based collaboration, open-loop latent collaboration, and other test-time-training objectives; on Qwen3-8B it raises AIME 2024 accuracy from 56.7% to 73.3%, a 16.6-point gain over the strongest open-loop latent baseline. Distinct from Grounding Faithfulness, which measures whether an output stays faithful to externally retrieved evidence, this check is reflexive and input-anchored: it asks only whether the model\'s own hidden state still contains the question. For agent systems it supplies a cheap self-supervised gate for any pipeline that compresses reasoning into latent handoffs: reconstruct the task from the compressed state before acting on it, and treat non-recoverability as a signal that the compression has quietly dropped the goal.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'ai-computation-test-time-training',
      description: 'ReLAT is a concrete self-supervised test-time training method; it instantiates the test-time-training paradigm with a query-reconstruction objective optimized before answer generation.',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-grounding-faithfulness',
      description: 'Both are fidelity checks, but grounding faithfulness anchors an output to external retrieved evidence whereas latent reconstruction anchors an internal latent state back to the original query specification.',
    },
    {
      type: 'analogy',
      targetId: 'ai-computation-activation-delta-probe',
      description: 'Like an activation-delta probe, this treats an opaque internal representation as inspectable by an input-anchored test, here recoverability of the question rather than a perturbation delta.',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-latent-world-model',
      description: 'Applies to the same regime of reasoning carried in latent representations; latent reconstruction supplies the missing loop-closing check that opaque latent world-model states otherwise lack.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
