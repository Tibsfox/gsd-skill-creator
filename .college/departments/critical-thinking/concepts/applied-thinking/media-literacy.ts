import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const mediaLiteracy: RosettaConcept = {
  id: 'crit-media-literacy',
  name: 'Media Literacy',
  domain: 'critical-thinking',
  description:
    'Media literacy is the ability to access, analyze, evaluate, and create media across all forms. ' +
    'A media-literate person asks: Who created this? What techniques are used to attract attention? ' +
    'Whose values and viewpoints are represented or omitted? How might different people understand it differently? ' +
    'These questions reveal the constructed, purposeful nature of all media content.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'crit-sourcing',
      description: 'Media literacy applies sourcing skills to visual, audio, and digital media',
    },
    {
      type: 'dependency',
      targetId: 'crit-confirmation-bias',
      description: 'Media consumption is heavily shaped by confirmation bias — we seek sources that confirm existing views',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.25 + 0.4225),
    angle: Math.atan2(0.65, 0.5),
  },
};
