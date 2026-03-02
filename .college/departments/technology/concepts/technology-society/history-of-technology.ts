import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const historyOfTechnology: RosettaConcept = {
  id: 'tech-history-of-technology',
  name: 'History of Technology',
  domain: 'technology',
  description:
    'Technology history traces how tools, machines, and systems shaped human society and vice versa. ' +
    'Major transitions: stone tools, agriculture, bronze and iron, writing, printing press, steam engine, ' +
    'electricity, telephone, digital computers, internet, and AI. ' +
    'Each transition created new capabilities and eliminated old ones, reshaping work, power, and social structure. ' +
    'Technology history shows that each generation\'s "unprecedented disruption" has historical precedents worth studying.',
  panels: new Map(),
  relationships: [],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.4225 + 0.25),
    angle: Math.atan2(0.5, 0.65),
  },
};
