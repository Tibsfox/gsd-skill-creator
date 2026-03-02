import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const colorTheory: RosettaConcept = {
  id: 'art-color-theory',
  name: 'Color Theory',
  domain: 'art',
  description:
    'Color theory is the body of knowledge about how colors interact, mix, and affect ' +
    'perception and emotion. The traditional color wheel (based on RYB primaries) shows ' +
    'complementary pairs (red-green, blue-orange, yellow-violet) that create maximum contrast ' +
    'and visual vibration when placed side by side. The Munsell system describes color ' +
    'with three independent dimensions: hue (wavelength identity), value (lightness/darkness), ' +
    'and chroma (saturation/intensity). Warm colors (red, orange, yellow) advance in the ' +
    'picture plane; cool colors (blue, green, violet) recede -- a principle used to create ' +
    'depth without perspective. The Itten color theory emphasizes simultaneous contrast: ' +
    'the same color appears different depending on its surrounding colors.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'art-color-mixing',
      description: 'Color mixing is the practical application of color theory',
    },
    {
      type: 'cross-reference',
      targetId: 'phys-waves-sound',
      description: 'Color is the perception of electromagnetic wavelengths, analogous to sound frequency',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.16 + 0.36),
    angle: Math.atan2(0.6, 0.4),
  },
};
