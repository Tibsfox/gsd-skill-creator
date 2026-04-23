/**
 * Agent Stability Index concept -- multi-agent behavioral consistency metric.
 *
 * Rath et al. (2026) introduced the Agent Stability Index (ASI) as a composite
 * behavioral metric for multi-agent LLM systems, demonstrating 70.4% ABA
 * (Aberrant Behavior Amplitude) reduction in stable vs. unstable configurations.
 *
 * @module departments/adaptive-systems/concepts/agent-stability-index
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~12*2pi/23, radius ~0.82 (systems metric, somewhat abstract)
const theta = 12 * 2 * Math.PI / 23;
const radius = 0.82;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const agentStabilityIndex: RosettaConcept = {
  id: 'adaptive-systems-agent-stability-index',
  name: 'Agent Stability Index',
  domain: 'adaptive-systems',
  description: 'The Agent Stability Index (ASI) quantifies behavioral consistency ' +
    'in multi-agent LLM systems by aggregating deviation signals across alignment ' +
    'drift, goal drift, and inter-agent communication coherence. Rath et al. ' +
    '(2026) demonstrated that high-ASI configurations achieve 70.4% reduction in ' +
    'Aberrant Behavior Amplitude (ABA) compared to unconstrained multi-agent ' +
    'baselines. ASI draws on Lyapunov stability theory adapted for discrete ' +
    'agent-state sequences: a system is stable if its behavioral trajectory ' +
    'remains within a bounded neighborhood of its initial instruction manifold.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'adaptive-systems-context-equilibrium',
      description: 'Context-equilibrium theory provides the per-agent stability model; ASI aggregates across agents to give a system-level stability score',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-alignment-drift',
      description: 'Alignment drift at the individual agent level is the primary input signal to ASI computation',
    },
    {
      type: 'cross-reference',
      targetId: 'adaptive-systems-lorenz-predictability-limit',
      description: 'Lorenz chaos theory informs ASI design: multi-agent systems can exhibit sensitive dependence on initial instructions, bounding the prediction horizon for stable behavior',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
