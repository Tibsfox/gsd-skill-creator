import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const sacredStories: RosettaConcept = {
  id: 'theo-sacred-stories',
  name: 'Sacred Stories',
  domain: 'theology',
  description:
    'Sacred stories (myths in the scholarly sense -- meaning-making narratives, not false tales) ' +
    'are the foundational texts through which religious communities transmit identity, values, ' +
    'and worldview across generations. Creation narratives explain how the world came to be and ' +
    'what humans\' place in it is: Genesis (relationship and stewardship), Enuma Elish ' +
    '(cosmic battle), Rigveda (primordial sacrifice), Dreamtime (eternal creative present). ' +
    'These are not competitors to scientific cosmology -- they address different questions. ' +
    'Hero and prophet narratives (Moses, Muhammad, the Buddha, Arjuna) establish moral exemplars ' +
    'and model the spiritual path. Flood narratives appear in over 200 cultures, likely reflecting ' +
    'ancient memory of catastrophic local floods. Comparative mythology (Campbell\'s monomyth) ' +
    'identifies structural patterns shared across traditions: departure, initiation, return.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'theo-world-religions',
      description: 'Sacred stories are transmitted within and shape the identity of world religion traditions',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.16 + 0.16),
    angle: Math.atan2(0.4, 0.4),
  },
};
