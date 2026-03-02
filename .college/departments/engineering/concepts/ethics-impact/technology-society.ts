import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const technologySociety: RosettaConcept = {
  id: 'engr-technology-society',
  name: 'Technology & Society',
  domain: 'engineering',
  description:
    'Technology is not neutral — engineering decisions embed values, create winners and losers, and reshape society. ' +
    'The industrial revolution, electrification, internet, and AI each transformed work, social structure, and power. ' +
    'Anticipatory governance asks engineers to consider second-order effects before deploying technology at scale. ' +
    'Engineers must think beyond "can we build this?" to "should we build this, and for whom?"',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'engr-engineering-ethics',
      description: 'Anticipating technology\'s societal impact is an extension of the engineer\'s ethical obligations',
    },
  ],
  complexPlanePosition: {
    real: 0.25,
    imaginary: 0.92,
    magnitude: Math.sqrt(0.0625 + 0.8464),
    angle: Math.atan2(0.92, 0.25),
  },
};
