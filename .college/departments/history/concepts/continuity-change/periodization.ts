import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const periodization: RosettaConcept = {
  id: 'hist-periodization',
  name: 'Periodization',
  domain: 'history',
  description:
    'Periodization is the practice of dividing history into named segments — Ancient, Medieval, Modern — ' +
    'to make it manageable and communicable. But all periodizations are constructs: the same years look ' +
    'like a turning point from a European perspective but may be unremarkable from a Chinese or African one. ' +
    'Critical engagement with periodization reveals whose history is centered and what assumptions ' +
    'underlie the boundaries historians draw.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'hist-long-term-change',
      description: 'Periodization attempts to mark when long-term changes were significant enough to define a new era',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.36 + 0.25),
    angle: Math.atan2(0.5, 0.6),
  },
};
