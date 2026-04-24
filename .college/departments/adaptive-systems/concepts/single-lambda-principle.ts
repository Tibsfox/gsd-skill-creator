/**
 * Single-λ Principle concept — collapse of heuristic knob clusters to one principled trade-off.
 *
 * LeJEPA (Balestriero & LeCun 2025) reports that its single hyperparameter λ
 * balancing the JEPA prediction loss against SIGReg is robust across a wide range,
 * collapsing what had historically been a lattice of anti-collapse heuristics
 * (stop-gradient schedules, EMA decay rates, teacher-student momentum, negative-
 * sample counts) into one principled trade-off. The concept generalizes: when a
 * distributional target is stated explicitly, many engineering safeguards reveal
 * themselves as symptoms of the unstated target and collapse into a single
 * principled parameter. The transposition to gsd-skill-creator is audited in Phase
 * 730 (T1c Single-λ orchestration audit): bounded-learning caps (20% content-change
 * cap, 3-correction minimum, 7-day cooldown), suggest thresholds, auto-load gates,
 * Lyapunov stability bands, dead-zone widths each guard a specific distributional
 * property; the audit asks which clusters can collapse to one parameter without
 * sacrificing the property each knob guards.
 *
 * @module departments/adaptive-systems/concepts/single-lambda-principle
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~9*2pi/23, radius ~0.84 (adaptive-systems orchestration, practical-adjacent)
const theta = 9 * 2 * Math.PI / 23;
const radius = 0.84;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const singleLambdaPrinciple: RosettaConcept = {
  id: 'adaptive-systems-single-lambda-principle',
  name: 'Single-λ Principle',
  domain: 'adaptive-systems',
  description: 'The Single-λ Principle is the design observation from LeJEPA ' +
    '(Balestriero & LeCun 2025) that once a distributional target is stated ' +
    'explicitly, many engineering safeguards that previously required independent ' +
    'tuning collapse into one principled trade-off parameter. LeJEPA\'s λ balances ' +
    'prediction loss against SIGReg and is robust across a wide range — the sweet ' +
    'spot is broad, not knife-edge. The principle generalizes past representation ' +
    'learning: whenever a system has accumulated a lattice of knobs (stop-gradient ' +
    'schedules, EMA decay rates, bounded-learning caps, correction minimums, ' +
    'cooldowns, confidence gates) without being able to articulate what each knob ' +
    'is guarding, the knobs are symptoms of an unstated target. Stating the target ' +
    'first, then choosing an objective that encodes it, typically collapses many ' +
    'knobs to one. For gsd-skill-creator, the Phase 730 T1c Single-λ orchestration ' +
    'audit enumerates every tunable knob (20% content-change cap, 3-correction ' +
    'minimum, 7-day cooldown, suggest thresholds, auto-load confidence gates, MB-1 ' +
    'Lyapunov stability bands, MB-5 dead-zone widths), identifies the ' +
    'distributional property each is guarding, and proposes single-λ-like balance ' +
    'parameters where clusters can collapse. Explicit non-collapse: CAPCOM gates, ' +
    'Safety Warden BLOCK authority, and the human-in-the-loop verdict at wave ' +
    'boundaries remain independent.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'ai-computation-isotropic-embedding',
      description: 'Single-λ is only possible once the distributional target is stated explicitly; isotropic embedding is LeJEPA\'s target',
    },
    {
      type: 'cross-reference',
      targetId: 'adaptive-systems-bounded-learning',
      description: 'Bounded-learning caps in gsd-skill-creator are the target of the Single-λ audit; the audit asks which cap clusters can collapse to one parameter',
    },
    {
      type: 'dependency',
      targetId: 'ai-computation-heuristics-free-ssl',
      description: 'Heuristics-free self-supervised learning is the existence proof that the single-λ collapse works in a real ML system',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
