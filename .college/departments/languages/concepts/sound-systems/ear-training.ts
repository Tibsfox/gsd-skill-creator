import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const earTraining: RosettaConcept = {
  id: 'lang-ear-training',
  name: 'Ear Training for Non-Native Sounds',
  domain: 'languages',
  description: 'Perceiving sounds that do not exist in your native language requires rewiring phonological filters. ' +
    'Perceptual training: discriminating between minimal pairs in the target language. ' +
    'Dichotic listening experiments show that the brain categorically perceives phonemes -- ' +
    'sounds between /b/ and /p/ are heard as one or the other, never as intermediate. ' +
    'Perceptual training protocols: 200+ exposures to minimal pair discrimination improves perception. ' +
    'High variability phonetic training (HVPT): hearing many different speakers saying the same sound ' +
    'is more effective than one speaker -- generalizes to new voices. ' +
    'Connection to production: you can only produce reliably what you can perceive reliably. ' +
    'Active listening vs. passive listening: focused discrimination exercises beat casual exposure.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'lang-phoneme-inventory',
      description: 'Ear training targets specific phoneme contrasts that your native language inventory lacks',
    },
    {
      type: 'cross-reference',
      targetId: 'psych-attention-memory',
      description: 'Attention is selective -- ear training directs attention to phoneme features the brain previously filtered out',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.4225 + 0.16),
    angle: Math.atan2(0.4, 0.65),
  },
};
