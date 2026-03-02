import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const flexibility: RosettaConcept = {
  id: 'pe-flexibility',
  name: 'Flexibility',
  domain: 'physical-education',
  description:
    'Flexibility is the range of motion available at a joint, determined by muscle length, ' +
    'connective tissue extensibility, and neuromuscular factors. Static flexibility improves ' +
    'through sustained stretch (30-60 seconds) that neurologically reduces protective reflex. ' +
    'Dynamic flexibility develops through controlled movement through range of motion. ' +
    'PNF (proprioceptive neuromuscular facilitation) stretching uses contraction-relaxation ' +
    'cycles to achieve greater range: contract the muscle being stretched for 6 seconds, ' +
    'relax, then stretch further. Hypermobility (excessive flexibility) without strength is ' +
    'a risk factor for injury -- flexibility must be matched by strength through range. ' +
    'Yoga and Pilates systematically develop both flexibility and the strength to use it. ' +
    'Fascia (connective tissue surrounding muscles) responds to slow, sustained stretching ' +
    'over multiple minutes -- not the same as acute muscle stretching.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mb-sun-salutation',
      description: 'Sun salutation sequences systematically develop flexibility through the full body',
    },
    {
      type: 'dependency',
      targetId: 'pe-injury-prevention',
      description: 'Appropriate flexibility reduces injury risk in joints and muscles',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.16 + 0.36),
    angle: Math.atan2(0.6, 0.4),
  },
};
