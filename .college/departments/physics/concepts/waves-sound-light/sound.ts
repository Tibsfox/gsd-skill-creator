import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const sound: RosettaConcept = {
  id: 'phys-sound',
  name: 'Sound',
  domain: 'physics',
  description:
    'Sound is a longitudinal mechanical wave propagating through a medium by alternating compression and ' +
    'rarefaction. Pitch corresponds to frequency; loudness to amplitude. The Doppler effect describes ' +
    'how relative motion between source and observer changes perceived frequency. Resonance, standing waves, ' +
    'and harmonics explain the rich sounds of musical instruments.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'phys-wave-properties',
      description: 'Sound is a mechanical wave and exhibits all general wave properties',
    },
  ],
  complexPlanePosition: {
    real: 0.75,
    imaginary: 0.25,
    magnitude: Math.sqrt(0.5625 + 0.0625),
    angle: Math.atan2(0.25, 0.75),
  },
};
