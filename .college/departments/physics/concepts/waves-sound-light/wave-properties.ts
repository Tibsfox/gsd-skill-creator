import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const waveProperties: RosettaConcept = {
  id: 'phys-wave-properties',
  name: 'Wave Properties',
  domain: 'physics',
  description:
    'Waves transfer energy without transferring matter. Key properties include wavelength (distance ' +
    'between crests), frequency (cycles per second), amplitude (crest height), and wave speed ' +
    '(v = fλ). Transverse waves (e.g., light) oscillate perpendicular to propagation; longitudinal waves ' +
    '(e.g., sound) oscillate parallel. Waves can reflect, refract, diffract, and interfere.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'phys-sound',
      description: 'Sound waves are a concrete application of wave properties in a mechanical medium',
    },
    {
      type: 'dependency',
      targetId: 'phys-electromagnetic-spectrum',
      description: 'Light and all electromagnetic radiation are waves described by the same properties',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.35,
    magnitude: Math.sqrt(0.49 + 0.1225),
    angle: Math.atan2(0.35, 0.7),
  },
};
