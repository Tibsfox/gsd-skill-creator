/**
 * Four-Tier Skill Trust Framework concept -- T1-T4 governance for community skills.
 *
 * Jiang et al. (2026, arXiv:2602.12430) propose a Skill Trust and Lifecycle Governance
 * Framework that gates community-contributed skills via four trust tiers T1-T4, each
 * with graduated deployment capabilities. The paper's baseline empirical finding is
 * that 26.1% of community-contributed skills contain vulnerabilities, which is the
 * number gsd-skill-creator's Staging Layer must beat. The framework is directly
 * adoptable as the intake-governance layer for Wasteland / GASTOWN / DoltHub.
 *
 * @module departments/ai-computation/concepts/four-tier-trust
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~20*2pi/23, radius ~0.90 (high-stakes, security-adjacent)
const theta = 20 * 2 * Math.PI / 23;
const radius = 0.90;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const fourTierTrust: RosettaConcept = {
  id: 'ai-computation-four-tier-trust',
  name: 'Four-Tier Skill Trust (T1-T4)',
  domain: 'ai-computation',
  description: 'Four-Tier Skill Trust is a gate-based governance model that maps ' +
    'skill provenance to graduated deployment capabilities across four tiers ' +
    '(T1 through T4). Proposed by Jiang et al. (2026) after surveying that 26.1% ' +
    'of community-contributed skills contain vulnerabilities, the framework is a ' +
    'practical response to federated skill sharing where the origin, auditability, ' +
    'and vulnerability history of a skill vary widely. For gsd-skill-creator, ' +
    'the pattern maps onto the Staging Layer: T1 skills (first-party, audited) ' +
    'promote freely; T4 skills (third-party, unaudited) are sandboxed until ' +
    'additional audit or reputation signal accumulates. The tier labels themselves ' +
    'become the vocabulary for expressing promotion decisions in CAPCOM gate logs.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'ai-computation-capability-evolution',
      description: 'Four-tier trust gates determine which ECMs (capability modules) may be promoted into each deployment tier',
    },
    {
      type: 'cross-reference',
      targetId: 'adaptive-systems-two-gate-guardrail',
      description: 'Each tier transition in the four-tier trust framework is a Two-Gate checkpoint: validation margin plus capacity cap',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
