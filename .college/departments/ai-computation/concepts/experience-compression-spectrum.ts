/**
 * Experience Compression Spectrum concept — cross-level compression axis for memory,
 * skills, and rules.
 *
 * Source: Experience Compression Spectrum (arXiv:2604.15877, Zhang et al.,
 * submitted April 17 2026).
 *
 * The paper establishes a single quantitative axis defined by compression ratio
 * relative to raw interaction trace: episodic memory at 5-20x compression,
 * procedural skill representations at 50-500x, declarative rules at >=1000x.
 * The key contribution is the identification of the missing diagonal: cross-level
 * adaptive compression as a first-class interface. gsd-skill-creator already
 * implements the three tiers implicitly (mission logs, skills, Safety Warden gates)
 * but does not name the cross-level migration interface as a primary architectural
 * object. This concept names it.
 *
 * Convergent-discovery classification: Medium-Strong. The three-tier architecture
 * is independently converged; the missing diagonal is independently identified.
 *
 * Milestone: v1.49.573 upstream-intelligence-pack-v1.44.
 *
 * @module departments/ai-computation/concepts/experience-compression-spectrum
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~5*2pi/29, radius ~0.89 (compression-axis ring)
const theta = 5 * 2 * Math.PI / 29;
const radius = 0.89;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const experienceCompressionSpectrum: RosettaConcept = {
  id: 'ai-computation-experience-compression-spectrum',
  name: 'Experience Compression Spectrum',
  domain: 'ai-computation',
  description: 'The Experience Compression Spectrum (arXiv:2604.15877) defines a ' +
    'unified quantitative axis for memory abstraction, measured as compression ' +
    'ratio relative to raw interaction trace. Episodic memory (mission logs) ' +
    'occupies the 5-20x band; procedural memory (skills) occupies the 50-500x band; ' +
    'declarative memory (Safety Warden gates, constitution rules) occupies the ' +
    '>=1000x band. The critical insight is the missing diagonal: cross-level adaptive ' +
    'compression between the three bands is a first-class architectural interface ' +
    'that current systems (including gsd-skill-creator) implement implicitly rather ' +
    'than naming explicitly. The paper treats the absence of the migration-diagonal ' +
    'interface as a performance bug. Phase 769 T2a (if budget) implements the ' +
    'cross-level compression layer as src/experience-compression/, using the three- ' +
    'tier compression-ratio bands as normative metadata annotations on the existing ' +
    'storage tiers. Convergent-discovery event: Zhang et al. independently arrive at ' +
    'the same three-tier artifact hierarchy that gsd-skill-creator implements.',
  panels: new Map([
    ['typescript', {
      panelId: 'typescript',
      explanation: 'Phase 769 exports a CompressionAxis class with ' +
        'classify(artifact: Artifact): CompressionTier and ' +
        'migrateUp(artifact: Artifact, targetTier: CompressionTier): Artifact. ' +
        'The migration-diagonal is the key interface: migrateUp compresses across ' +
        'tiers using the ratio bands as quality floors. See arXiv:2604.15877.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'ai-computation-semantic-channel',
      description: 'The semantic-channel model applies at the procedural (50-500x) ' +
        'tier: a skill compressed into the procedural tier encodes intent and ' +
        'instructions in the channel\'s rate-distortion budget, and the compression ' +
        'ratio bound corresponds to the channel capacity.',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-bounded-learning-theorem',
      description: 'The experience-compression-spectrum\'s declarative-rule tier ' +
        '(>=1000x) corresponds exactly to the bounded-learning constitution: Safety ' +
        'Warden rules are maximally compressed declarative structures, and the 20% ' +
        'change cap on skill updates bounds the migration rate from procedural to ' +
        'declarative tier.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
