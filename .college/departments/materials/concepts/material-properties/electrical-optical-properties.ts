import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const electricalOpticalProperties: RosettaConcept = {
  id: 'mfab-electrical-optical-properties',
  name: 'Electrical & Optical Properties',
  domain: 'materials',
  description:
    'Electrical conductivity classifies materials as conductors (metals), semiconductors (silicon), or insulators (ceramics). ' +
    'Dielectric constant matters for capacitors and insulation. Magnetic properties (ferromagnetism, paramagnetism) ' +
    'are critical for motors, data storage, and transformers. ' +
    'Optical properties — transparency, refractive index, reflectivity — determine use in optics, coatings, and displays. ' +
    'Advanced materials engineering exploits the same microstructure to optimize multiple property sets simultaneously.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mfab-mechanical-properties',
      description: 'The same microstructural factors that control mechanical properties also determine electrical behavior',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.36 + 0.3025),
    angle: Math.atan2(0.55, 0.6),
  },
};
