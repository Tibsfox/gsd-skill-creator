/**
 * Alignment Drift concept -- task-instruction fidelity degradation over conversation.
 *
 * Das et al. (2025) quantified alignment drift using TraceAlign + BCI
 * (Behavioral Consistency Index), demonstrating a 40% → 6.2% drift reduction
 * after applying alignment-preserving fine-tuning.
 *
 * @module departments/ai-computation/concepts/alignment-drift
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~7*2pi/23, radius ~0.75 (safety-critical, moderate abstraction)
const theta = 7 * 2 * Math.PI / 23;
const radius = 0.75;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const alignmentDrift: RosettaConcept = {
  id: 'ai-computation-alignment-drift',
  name: 'Alignment Drift',
  domain: 'ai-computation',
  description: 'Alignment drift describes the progressive erosion of an LLM\'s ' +
    'fidelity to its instruction-tuning objectives as conversational context ' +
    'accumulates. Das et al. (2025) introduced TraceAlign, a trace-level ' +
    'alignment monitoring framework, and the Behavioral Consistency Index (BCI) ' +
    'as a scalar measure of instruction adherence over time. Baseline alignment ' +
    'drift rates reached 40% in long-horizon tasks; TraceAlign fine-tuning ' +
    'reduced this to 6.2%. Alignment drift is distinct from goal drift: it ' +
    'measures adherence to the original instruction, not emergence of new objectives.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'ai-computation-goal-drift',
      description: 'Alignment drift (instruction-fidelity loss) and goal drift (emergent-objective acquisition) are complementary failure modes at different abstraction levels',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-activation-delta-probe',
      description: 'Activation-delta probes provide a mechanistic signal that correlates with BCI degradation during alignment drift episodes',
    },
    {
      type: 'cross-reference',
      targetId: 'adaptive-systems-agent-stability-index',
      description: 'ASI (Rath 2026) measures behavioral consistency at the agent-network level; BCI is the single-agent analog',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
