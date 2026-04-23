/**
 * Two-Gate Guardrail concept -- formalized bounded self-modification safety.
 *
 * Wang and Dorchen (2025, arXiv:2510.04399) prove that distribution-free PAC
 * learnability is preserved under self-modification if and only if the policy-
 * reachable hypothesis family has uniformly bounded capacity. They formalize the
 * guarantee as a Two-Gate guardrail: a validation margin tau plus a capacity cap
 * K[m], with an oracle inequality at VC rates. This is the theoretical backing
 * for gsd-skill-creator's CAPCOM-plus-Safety-Warden split; the 20% content-change
 * cap and three-correction minimum are the practical realization of K[m].
 *
 * @module departments/adaptive-systems/concepts/two-gate-guardrail
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~15*2pi/23, radius ~0.88 (theoretical, high-stakes)
const theta = 15 * 2 * Math.PI / 23;
const radius = 0.88;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const twoGateGuardrail: RosettaConcept = {
  id: 'adaptive-systems-two-gate-guardrail',
  name: 'Two-Gate Guardrail',
  domain: 'adaptive-systems',
  description: 'The Two-Gate Guardrail formalizes the conditions under which an ' +
    'agent can modify its own policy without losing distribution-free PAC ' +
    'learnability. Wang and Dorchen (2025) prove an if-and-only-if: preservation ' +
    'holds exactly when the policy-reachable hypothesis family has uniformly ' +
    'bounded capacity. The two gates are a validation margin tau (how much error ' +
    'tolerance at the decision boundary) and a capacity cap K[m] (how much ' +
    'complexity the hypothesis family can absorb before generalization collapses). ' +
    'The pair admits an oracle inequality at VC rates. For gsd-skill-creator, the ' +
    'Two-Gate maps directly onto CAPCOM plus Safety Warden: CAPCOM enforces tau ' +
    'at each wave boundary (validation-margin checks), and Safety Warden enforces ' +
    'K[m] at promotion (refusing skills whose capacity exceeds the staging-layer ' +
    'bound). The 20-percent content-change cap and three-correction minimum are ' +
    'the specific K[m] realization the codebase has shipped.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'ai-computation-capability-evolution',
      description: 'The Two-Gate guardrail governs which ECMs may evolve via self-modification; capability evolution is bounded by the capacity cap K[m]',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-four-tier-trust',
      description: 'Each tier transition in the four-tier trust framework is a Two-Gate checkpoint: tau plus K[m] enforcement at the gate',
    },
    {
      type: 'cross-reference',
      targetId: 'adaptive-systems-agent-stability-index',
      description: 'The Agent Stability Index measures violations of the Two-Gate bound over time; a rising ASI indicates bound-cap approach',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
