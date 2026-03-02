import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const informationRepresentation: RosettaConcept = {
  id: 'diglit-information-representation',
  name: 'Digital Information Representation',
  domain: 'digital-literacy',
  description: 'All digital information is ultimately encoded as binary (0s and 1s). ' +
    'A bit is a single binary digit. A byte is 8 bits (256 possible values). ' +
    'ASCII: maps bytes to text characters (65=A, 97=a). Unicode/UTF-8: extends to all human scripts. ' +
    'Images: pixels, each a color value (RGB: 3 bytes per pixel). ' +
    'A 12-megapixel photo uncompressed = 36MB. JPEG compression reduces this 10-20x. ' +
    'Audio: samples of sound pressure at regular intervals (44,100 samples/second for CD quality). ' +
    'Video: sequence of image frames + audio. ' +
    'The key insight: text, images, audio, video, and code are ALL just numbers -- ' +
    'computers do not understand meaning, only patterns in data.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'code-variables-data-types',
      description: 'Data types in programming are specifications of how bits are interpreted -- int vs. float vs. char',
    },
    {
      type: 'cross-reference',
      targetId: 'data-data-sources',
      description: 'All data -- regardless of format -- is ultimately binary representation of measurements or symbols',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.45,
    magnitude: Math.sqrt(0.36 + 0.2025),
    angle: Math.atan2(0.45, 0.6),
  },
};
