import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const colorMixing: RosettaConcept = {
  id: 'art-color-mixing',
  name: 'Color Mixing',
  domain: 'art',
  description:
    'Subtractive color mixing (pigments) works differently from additive mixing (light). ' +
    'In subtractive mixing, combining all pigment colors produces near-black; the primary ' +
    'colors (RYB or CMY in printing) cannot be made from other colors. Secondary colors ' +
    'are made by mixing two primaries: red + yellow = orange, blue + yellow = green, ' +
    'red + blue = violet. Tertiary colors result from mixing a primary with an adjacent ' +
    'secondary. Tints are pigment + white; shades are pigment + black; tones use grey. ' +
    'The neutral grey method for mixing: adding a color\'s complement desaturates it toward ' +
    'grey -- more nuanced than using black, which shifts hue. Plein-air painters mix ' +
    'on a limited palette (Zorn palette: yellow ochre, red ochre, ivory black, white) ' +
    'to ensure color harmony through shared pigments.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'art-color-theory',
      description: 'Color mixing is grounded in color theory principles',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.25 + 0.25),
    angle: Math.atan2(0.5, 0.5),
  },
};
