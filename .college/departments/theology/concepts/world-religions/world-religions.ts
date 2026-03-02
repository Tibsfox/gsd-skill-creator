import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const worldReligions: RosettaConcept = {
  id: 'theo-world-religions',
  name: 'World Religions Survey',
  domain: 'theology',
  description:
    'The world\'s major religious traditions represent humanity\'s diverse responses to ' +
    'fundamental questions about ultimate reality, meaning, and how to live. ' +
    'Christianity (~2.4 billion): centered on the life, death, and resurrection of Jesus; ' +
    'salvation through faith; Trinity doctrine. Islam (~1.9 billion): submission to Allah; ' +
    'Five Pillars (shahada, salat, zakat, sawm, hajj); Quran as final revelation. ' +
    'Judaism (~15 million): covenant between God and the Jewish people; Torah as law and story; ' +
    'emphasis on this-worldly ethics and community. Hinduism (~1.2 billion): polytheistic with ' +
    'underlying Brahman unity; karma, dharma, samsara, moksha; diverse paths (bhakti, jnana, karma yoga). ' +
    'Buddhism (~500 million): Four Noble Truths about suffering; Eightfold Path to liberation; ' +
    'Theravada, Mahayana, and Vajrayana branches. Each tradition has internal diversity -- ' +
    'speaking of a monolithic "Islam" or "Christianity" misrepresents lived reality.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'theo-sacred-stories',
      description: 'Each world religion is transmitted partly through its sacred narrative tradition',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.25 + 0.25),
    angle: Math.atan2(0.5, 0.5),
  },
};
