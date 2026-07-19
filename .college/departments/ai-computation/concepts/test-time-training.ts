/**
 * Test-Time Training With Next-Token Prediction concept — ai-computation (June-2026 additional-scan batch B, T2).
 *
 * Source: arXiv:2606.21803 (2026).
 *
 * @module departments/ai-computation/concepts/test-time-training
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 8 * 2 * Math.PI / 29;
const radius = 0.93;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const testTimeTraining: RosettaConcept = {
  id: 'ai-computation-test-time-training',
  name: 'Test-Time Training With Next-Token Prediction',
  domain: 'ai-computation',
  description: 'Test-Time Training with Next-Token Prediction (TTT-NTP) is a drop-in fast-weight adaptation method for pretrained long-context LLMs that runs an inner optimization loop during inference, using the same self-supervised signal that trained the model — next-token prediction — to decide what each local weight write should store. In-place test-time-training methods let a released checkpoint adapt fast weights as it reads a prompt without redesigning the backbone, but they leave open what target each write should match; prior recipes fit the fast weight to a learned local value proxy only loosely tied to the model\'s actual objective. TTT-NTP instead sets the write target to a pointwise linear projection of the single next-position contextual hidden state, so every local write follows the same causal computation that already supports next-token prediction. Per arXiv:2606.21803 (2026), it is the only method that consistently improves the released backbone on RULER Full-13 (averaged over 4k/8k/16k/32k) across four models spanning three families and a 0.6-8B size range — Llama-3.1-8B +3.9, Mistral-7B-v0.3 +3.0, Qwen3-4B +4.1, Qwen3-0.6B +2.9 — and improves LongBench-v2 long-document QA (Llama +5.6, Mistral +3.7) while preserving commonsense and knowledge performance. Distinct from Local Linearity Steering, which perturbs activations along a fixed learned direction and never modifies weights, TTT-NTP writes fast weights supervised online by the model\'s own predictive signal. For agent systems this implies long-context memory can be maintained by letting a released model briefly self-train on its own context — a per-request adaptation primitive requiring no fine-tuning, no retrieval index, and no architectural change to the deployed checkpoint.',
  panels: new Map(),
  relationships: [
    {
      type: 'analogy',
      targetId: 'ai-computation-local-linearity-steering',
      description: 'Both adapt a released checkpoint at inference time with no fine-tuning, but Local Linearity Steering perturbs activations along a fixed learned direction while TTT-NTP writes fast weights supervised online by the model\'s own next-token-prediction target.',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-experience-compression-spectrum',
      description: 'TTT-NTP gives a concrete answer to the \'what should each write store\' question by compressing observed context into fast weights via the model\'s own predictive projection, a specific operating point on how experience gets compressed into parameters.',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-serialization-attention-decay',
      description: 'TTT-NTP targets the long-context regime (RULER, LongBench-v2) where serialized attention degrades, supplying an adaptive fast-weight store that supplements the decaying attention pattern over long inputs.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
