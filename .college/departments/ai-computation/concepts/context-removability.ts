/**
 * Context Removability concept — ai-computation (June-2026 additional-scan batch B, T2).
 *
 * Source: arXiv:2606.11627 (2026).
 *
 * @module departments/ai-computation/concepts/context-removability
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 7 * 2 * Math.PI / 29;
const radius = 0.93;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const contextRemovability: RosettaConcept = {
  id: 'ai-computation-context-removability',
  name: 'Context Removability',
  domain: 'ai-computation',
  description: 'Context removability is a robustness property of a model that has undergone on-policy distillation of privileged context — system prompts or task hints that a teacher conditioned on and that the student learns to internalize so the context is no longer needed at inference. arXiv:2606.11627 (2026) identifies a previously unstudied failure of naive internalization it names context-induced degradation: reintroducing the original privileged context to the distilled student actually lowers accuracy, even on instances the student already solves correctly with no context. The paper argues robust internalization demands not only matching the teacher\'s context-conditioned behavior but also staying stable when the context returns — the property they term context removability. Their fix is a lightweight consistency regularizer: anchor the student\'s no-context output with a stop-gradient, then penalize the context-conditioned output for deviating from that anchor via a forward-KL divergence, costing just one extra forward pass per training step. Across 12 configurations spanning diverse domains and model families it improves context-conditioned accuracy in the majority of settings, reduces context-induced harm in 11 of 12, and effectively eliminates response-length inflation; a mechanistic case study confirms the property holds at the representation level, with hidden states nearly identical whether or not the context is present. Distinct from Contextual Entrainment, which describes how in-context tokens steer an already-deployed model at inference time: context removability is a training-time invariance objective that makes a distilled student\'s activations insensitive to the very context it absorbed. For agent systems this means prompt-compression and hint-internalization pipelines cannot be validated on no-context accuracy alone — you must regression-test the student with the original scaffolding reinserted, since deployed agents routinely still receive those system prompts.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'ai-computation-contextual-entrainment',
      description: 'Both concern how reintroduced in-context tokens alter model behavior; context-induced degradation is a distillation-specific failure where the returned context harms rather than helps, whereas contextual entrainment describes generic inference-time steering by context.',
    },
    {
      type: 'dependency',
      targetId: 'ai-computation-activation-delta-probe',
      description: 'The paper\'s claim that context removability is achieved at the representation level — hidden states nearly identical with and without context — is exactly the kind of activation difference an activation-delta probe measures, making that probe the natural verification instrument for this property.',
    },
    {
      type: 'analogy',
      targetId: 'ai-computation-experience-compression-spectrum',
      description: 'On-policy distillation compresses privileged context into weights much as experience is compressed into reusable capability; context-induced degradation is a cautionary failure mode of that compression when the source signal is later re-presented.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
