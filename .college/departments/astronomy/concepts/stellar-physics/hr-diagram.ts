import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const hrDiagram: RosettaConcept = {
  id: 'astro-hr-diagram',
  name: 'Hertzsprung-Russell Diagram',
  domain: 'astronomy',
  description:
    'The Hertzsprung-Russell (H-R) diagram plots stellar luminosity (y-axis, increasing upward) ' +
    'against surface temperature or spectral class (x-axis, temperature decreasing leftward from ' +
    'blue-hot O-type to cool red M-type). Its power lies in revealing stellar evolutionary stages ' +
    'as non-random clusterings. The main sequence (diagonal band, upper-left to lower-right) ' +
    'contains hydrogen-burning stars including the Sun (G2V: surface temp ~5,778 K, luminosity ' +
    '1 L☉). More massive main sequence stars burn hotter, brighter, and much shorter lives ' +
    '(O-type stars live millions of years vs. M-type red dwarfs living trillions). Giants and ' +
    'supergiants (upper-right) are evolved stars that have left the main sequence — core hydrogen ' +
    'exhausted, shell burning expands the envelope. White dwarfs (lower-left) are the compact ' +
    'remnants of low-mass stars after planetary nebula ejection. The H-R diagram transforms ' +
    'stellar spectroscopy data into a visual evolutionary narrative that underpins all of stellar ' +
    'astronomy.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'astro-stellar-spectroscopy',
      description: 'Stellar spectroscopy determines the temperature and luminosity data that place stars on the H-R diagram',
    },
    {
      type: 'analogy',
      targetId: 'astro-stellar-physics',
      description: 'The H-R diagram is the visual language for stellar physics concepts of nuclear burning stages and stellar evolution',
    },
  ],
  complexPlanePosition: {
    real: 0.45,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.2025 + 0.3025),
    angle: Math.atan2(0.55, 0.45),
  },
};
