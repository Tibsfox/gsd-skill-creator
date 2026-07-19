/**
 * Recursive Self-Gate Collapse concept — ai-computation (June-2026 additional-scan batch B, T2).
 *
 * Source: arXiv:2606.28438 (2026).
 *
 * @module departments/ai-computation/concepts/recursive-self-gate-collapse
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 1 * 2 * Math.PI / 29;
const radius = 0.93;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const recursiveSelfGateCollapse: RosettaConcept = {
  id: 'ai-computation-recursive-self-gate-collapse',
  name: 'Recursive Self-Gate Collapse',
  domain: 'ai-computation',
  description: 'Recursive Self-Gate Collapse is a training-dynamics failure that appears when a code LLM is fine-tuned on its own generations and the quality gate deciding which generations survive is itself powered by the same model — perplexity thresholds or binary self-scoring — rather than by model-independent checks. arXiv:2606.28438 (2026) frames review as gated distributional reweighting and compares three recursive fine-tuning regimes: no review (collapses fastest), a Human-gate using compilation and static-quality filters (slows but does not stop collapse), and an AI-self-gate (looks strong early, then loses its filtering effect). In the clearest case the binary self-gate enters a rubber-stamp regime where acceptance scores rise while benchmark correctness falls; the paper proves this self-gate provably degenerates to ungated self-training once a self-confirming acceptance condition holds, and backs it with a spectral analysis showing representation-level covariance concentrating under recursive retraining. The load-bearing claim is that a verifier coupled to the generator carries no independent information, so it cannot arrest the loop — stable recursive training requires exogenous, model-independent verification. Distinct from Alignment Drift, which tracks a model\'s behavior wandering from intended values across interaction or training: here the pathology is that the acceptance metric and the true-correctness metric decouple and move in opposite directions, so the gate reports health precisely as the model rots. For agent systems and self-modifying tooling — code that AI writes, gates, and later re-ingests — the implication is to never let a model\'s own confidence signal be the admission filter for its future training or skill corpus; route acceptance through compilation, tests, or held-out human checks, and alarm whenever accept-rate climbs while an independent correctness probe declines.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'Guard a self-training or skill-ingest loop by separating the admission signal from an independent correctness probe. Track a moving accept-rate from the model\'s own gate (self_score >= tau) alongside pass-rate on a frozen held-out suite that the model never gates. Compute their divergence each round; when accept-rate climbs while held-out pass-rate declines for k consecutive rounds, you are entering the rubber-stamp regime — fail closed, halt ingestion, and require an exogenous filter (compilation, tests, or human review) before any generation may re-enter the training or skill corpus.',
    }],
  ]),
  relationships: [
    {
      type: 'dependency',
      targetId: 'ai-computation-bounded-learning-theorem',
      description: 'The collapse result operationalizes the Bounded-Learning Theorem\'s core limit: a system cannot exceed its own information by recursing on self-generated signal, so the self-gate\'s stability bound is set by whatever exogenous verification is injected, not by the model.',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-alignment-drift',
      description: 'Both describe recursive degradation over training, but Alignment Drift tracks behavior wandering from intended values, whereas Recursive Self-Gate Collapse is the sharper case where the acceptance metric rises as true correctness falls — the monitor itself becoming corrupted.',
    },
    {
      type: 'analogy',
      targetId: 'ai-computation-blind-tool-deference',
      description: 'A model trusting its own perplexity or binary self-score as a quality gate is the training-time analogue of Blind Tool Deference: an agent accepting a signal as authoritative without an independent check, so errors pass through unexamined.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
