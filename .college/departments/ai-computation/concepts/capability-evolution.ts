/**
 * Capability Evolution (ECM) concept -- identity/capability decoupling for LLM agents.
 *
 * Qin et al. (2026, arXiv:2604.07799) introduced Embodied Capability Modules (ECMs):
 * modular, versioned units of functionality learned, refined, and composed over time,
 * decoupled from agent identity. A runtime enforces invariant safety envelopes
 * independent of the ECMs. Reports 11.8% of episodes produce unsafe actions without
 * policy enforcement; the runtime layer blocks 100% at 2.3ms overhead per decision.
 * Formal statement of the Amiga Principle: persistent agent as cognitive identity,
 * evolve capabilities separately.
 *
 * @module departments/ai-computation/concepts/capability-evolution
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~14*2pi/23, radius ~0.87 (architectural, safety-adjacent)
const theta = 14 * 2 * Math.PI / 23;
const radius = 0.87;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const capabilityEvolution: RosettaConcept = {
  id: 'ai-computation-capability-evolution',
  name: 'Capability Evolution (ECM)',
  domain: 'ai-computation',
  description: 'Capability Evolution refers to the architectural pattern in which ' +
    'agent capabilities are versioned, modular, and refined separately from the ' +
    'persistent identity of the agent itself. Qin et al. (2026) formalize this as ' +
    'Embodied Capability Modules (ECMs), demonstrating that a runtime-level safety ' +
    'envelope catches 11.8% of unsafe actions that would otherwise be produced, at ' +
    '2.3ms overhead per decision. The pattern is the formal statement of the Amiga ' +
    'Principle that gsd-skill-creator has been articulating informally: persistent ' +
    'identity as the stable cognitive substrate, capabilities as versioned modules ' +
    'that can be added, upgraded, or removed without disturbing the substrate. The ' +
    'pattern maps directly onto the chipset / Instruction-Set-Architecture split ' +
    'where "chipset" is the identity layer and "ISAs" are capability modules.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'ai-computation-four-tier-trust',
      description: 'Four-tier trust gates govern which ECMs may be promoted into a given deployment tier',
    },
    {
      type: 'cross-reference',
      targetId: 'adaptive-systems-two-gate-guardrail',
      description: 'The Two-Gate guardrail provides the theoretical safety envelope that ECM runtimes practically enforce',
    },
    {
      type: 'dependency',
      targetId: 'ai-computation-harness-as-object',
      description: 'ECM composition requires a first-class harness object that coordinates capability loading, versioning, and safety checks',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
