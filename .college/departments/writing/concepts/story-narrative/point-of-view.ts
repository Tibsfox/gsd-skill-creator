import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const pointOfView: RosettaConcept = {
  id: 'writ-point-of-view',
  name: 'Point of View & Narrative Distance',
  domain: 'writing',
  description: 'Point of view is the vantage from which a story is told. ' +
    'First person (I): intimate, limited to narrator\'s knowledge, potentially unreliable. ' +
    'Second person (you): unusual, immersive, as in Choose Your Own Adventure or Italo Calvino. ' +
    'Third limited (he/she/they): follows one character closely -- the most common choice. ' +
    'Third omniscient: narrator knows all characters\' thoughts -- allows wider scope but less intimacy. ' +
    'Narrative distance: "John was angry" (telling) vs. "John slammed the door. His hands shook." (showing). ' +
    'Free indirect discourse: third person but with the character\'s voice seeping in -- ' +
    'Jane Austen\'s signature technique. ' +
    'Unreliable narrator: reader must read against the grain of the narrator\'s self-presentation.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'writ-character-development',
      description: 'POV choice determines how deeply into a character\'s psychology readers can access',
    },
    {
      type: 'cross-reference',
      targetId: 'psych-attribution-theory',
      description: 'Attribution errors in psychology mirror unreliable narrator effects -- both involve systematic distortions in perspective',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.16 + 0.4225),
    angle: Math.atan2(0.65, 0.4),
  },
};
