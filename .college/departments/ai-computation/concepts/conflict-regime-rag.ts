/**
 * Conflict-Regime RAG Specialization -- ai-computation concept (June-2026 arXiv additional scan, T2).
 * @module departments/ai-computation/concepts/conflict-regime-rag
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 21 * 2 * Math.PI / 23;
const radius = 0.8;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const conflictRegimeRag: RosettaConcept = {
  id: "ai-computation-conflict-regime-rag",
  name: "Conflict-Regime RAG Specialization",
  domain: 'ai-computation',
  description:
    "Conflict-Regime RAG Specialization (RAPS-DA) tackles the fragility of retrieval-augmented generation when retrieved context conflicts with a model's parametric knowledge (arXiv 2606.30518, 2026). Rather than regime-agnostic supervision that conflates incompatible learning signals, it partitions sample-level conflicts along a reliability spectrum into three regimes — Grounding, Arbitration, and Resistance — training one same-scale peer specialist per regime from a shared base model and hard-routing each sample to its matched peer for on-policy reverse-KL supervision. A dual-layer token selector uses inter-teacher disagreement, student-teacher divergence, and student entropy to filter unstable tokens and gradually concentrate supervision on high-conflict ones. Its distinct contribution: gains come from specialization at fixed model scale, not a stronger teacher, and peers exist only during training, so the deployed student needs no regime labels or peer access. Across five conflict scenarios and two out-of-distribution benchmarks it surpasses every prompting, decoding, fine-tuning, RL, and single-teacher baseline, anchoring the specialization-not-a-stronger-teacher claim empirically. For agent systems, one deployed model can handle evidence spanning trustworthy sources to adversarial injections without runtime routing cost.",
  panels: new Map(),
  relationships: [
    {
      type: "cross-reference",
      targetId: "ai-computation-knowledge-conflict-steering",
      description: "Both target the same failure — retrieved context clashing with parametric knowledge — but where knowledge-conflict-steering intervenes on activations at inference, RAPS-DA disentangles the conflict during training by routing each sample to a reliability-regime-matched peer specialist.",
    },
    {
      type: "cross-reference",
      targetId: "ai-computation-four-tier-trust",
      description: "The reliability spectrum RAPS-DA uses to assign each sample its regime (reliable, partially reliable, adversarial) is the same graded-trust axis that four-tier-trust formalizes for ranking evidence sources.",
    },
    {
      type: "analogy",
      targetId: "skill-injection-guardian",
      description: "RAPS-DA's Resistance-regime specialist, which teaches the student to reject adversarial retrieved context, is the training-time analogue of skill-injection-guardian rejecting embedded malicious instructions at ingest.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
