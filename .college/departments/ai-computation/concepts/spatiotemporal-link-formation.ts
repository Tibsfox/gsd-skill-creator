/**
 * Spatiotemporal Link Formation concept — GNN predictive layer for skill auto-loading.
 *
 * Source: Spatiotemporal Link Formation Prediction in Social Learning Networks
 * (arXiv:2604.18888, Mohammadiasl et al., EDM 2026).
 *
 * The paper applies temporal-attention graph neural networks to a learner-content
 * interaction graph to predict future link formation. On the MOOC benchmark dataset,
 * the GNN-predicted next-interaction probabilities achieve precision@5 of 0.71
 * versus 0.54 for a recency baseline. The spatiotemporal pattern is the predictive
 * signal: not just which skills were recently activated, but which skills are
 * predicted to be activated next given the temporal interaction graph structure.
 *
 * For gsd-skill-creator, the College of Knowledge models the active session agent
 * and skills as nodes in a temporal interaction graph, with skill activations as
 * edges. The predictive skill auto-loader (Phase 770 T2b) pre-warms the k skills
 * with highest predicted next-activation probability, replacing heuristic-recency
 * pre-warming. Convergent-discovery classification: Strong (EDM 2026 peer-review;
 * precision@5 0.71 vs 0.54 baseline is quantitative validation of the architecture;
 * cold-start failure mode is named, giving GSD's recency-fallback a published
 * precedent).
 *
 * Milestone: v1.49.573 upstream-intelligence-pack-v1.44.
 *
 * @module departments/ai-computation/concepts/spatiotemporal-link-formation
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~9*2pi/29, radius ~0.90 (predictive-graph ring)
const theta = 9 * 2 * Math.PI / 29;
const radius = 0.90;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const spatiotemporalLinkFormation: RosettaConcept = {
  id: 'ai-computation-spatiotemporal-link-formation',
  name: 'Spatiotemporal Link Formation',
  domain: 'ai-computation',
  description: 'Spatiotemporal Link Formation (arXiv:2604.18888, EDM 2026) applies ' +
    'temporal-attention graph neural networks to learner-content interaction graphs ' +
    'to predict which skill (content node) an agent (learner node) will activate ' +
    'next. The architecture uses bilinear link-formation scoring over the ' +
    'temporal-attention aggregated node embeddings: ' +
    'score(u, v, t) = embed(u, t)^T * W * embed(v, t). Precision@5 of 0.71 versus ' +
    '0.54 recency baseline on the MOOC dataset (Mohammadiasl et al.). The paper ' +
    'explicitly names the cold-start failure mode: when fewer than n_min activations ' +
    'are available, the GNN reverts to recency-heuristic pre-warming. For ' +
    'gsd-skill-creator Phase 770 T2b, the predictive skill auto-loader wires into ' +
    'the existing skill-loader hook API only (orchestration byte-identical with flag ' +
    'off; CAPCOM Gate G12 hard-preservation). The cold-start fallback threshold is ' +
    'set at 50 activations per the synthesis design decisions.',
  panels: new Map([
    ['typescript', {
      panelId: 'typescript',
      explanation: 'Phase 770 exports a PredictiveSkillLoader implementing the ' +
        'SkillLoaderHook interface: predictNext(sessionGraph: TemporalGraph, ' +
        'k: number): SkillId[]. The temporal graph accumulates skill activations as ' +
        'time-stamped edges. Below 50 activations (cold-start threshold), falls back ' +
        'to recency ordering. CAPCOM Gate G12: orchestration src/ is byte-identical ' +
        'when upstream-intelligence.predictive-loader is false. See arXiv:2604.18888.',
    }],
    ['python', {
      panelId: 'python',
      explanation: 'A PyTorch Geometric implementation of the temporal GNN uses ' +
        'TransformerConv with time-encoded edge features. Link-formation probability ' +
        'is the sigmoid of the bilinear score. Top-k skills by probability are the ' +
        'pre-warm candidates. See arXiv:2604.18888 Fig. 2.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'ai-computation-koopman-bilinear-form',
      description: 'The bilinear link-formation scoring in the spatiotemporal GNN ' +
        'is structurally analogous to the Koopman bilinear form: both compute a ' +
        'bilinear product over two state vectors. The two concepts co-locate at the ' +
        'predictive-memory boundary in the Silicon Layer / College of Knowledge stack.',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-bounded-learning-theorem',
      description: 'The predictive loader pre-warms skills but does not modify ' +
        'skill weights; the bounded-learning constitution applies only to weight ' +
        'updates, not to read-only pre-warming operations. The loader is read-only ' +
        'relative to the skill library.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
