import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const binaryData: RosettaConcept = {
  id: 'tech-binary-data',
  name: 'Binary & Data Representation',
  domain: 'technology',
  description:
    'Digital computers represent all information as binary (0s and 1s). ' +
    'Numbers are represented in base-2; 8 bits = 1 byte can represent 256 values (0-255). ' +
    'ASCII and Unicode encode text characters. Images are represented as pixel grids with color values. ' +
    'Audio is represented as sampled amplitude values. ' +
    'Understanding binary representation demystifies why files have sizes, why images degrade when compressed, ' +
    'and why color depth matters for visual quality.',
  panels: new Map(),
  relationships: [],
  complexPlanePosition: {
    real: 0.85,
    imaginary: 0.15,
    magnitude: Math.sqrt(0.7225 + 0.0225),
    angle: Math.atan2(0.15, 0.85),
  },
};
