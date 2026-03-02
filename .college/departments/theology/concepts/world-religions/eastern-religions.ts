import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const easternReligions: RosettaConcept = {
  id: 'theo-eastern-religions',
  name: 'Eastern Religions',
  domain: 'theology',
  description:
    'The Dharmic traditions (Hinduism, Buddhism, Jainism, Sikhism) originating in South and ' +
    'East Asia share concepts of karma (moral causation across lives), dharma (cosmic order and ' +
    'duty), and liberation as a spiritual goal, while diverging significantly in metaphysics and ' +
    'practice. Hinduism is not a single tradition but a family of theologies (Advaita Vedanta, ' +
    'Vishishtadvaita, Dvaita), scriptures (Vedas, Upanishads, Bhagavad Gita, Puranas), and ' +
    'practice streams (jnana, bhakti, karma yoga). Buddhism\'s Three Jewels (Buddha, Dharma, ' +
    'Sangha) and Four Noble Truths (suffering, its cause, its cessation, the path) span Theravada, ' +
    'Mahayana, and Vajrayana schools. Jainism emphasizes ahimsa (non-violence) and anekantavada ' +
    '(many-sidedness of truth) with a strict monastic tradition. Sikhism (15th c. Punjab): one ' +
    'God (Waheguru), the Guru Granth Sahib as living scripture, and five Ks of Khalsa identity. ' +
    'Taoism and Confucianism from China complement Indian Dharmic traditions in the broad ' +
    '"Eastern religions" category.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'theo-world-religions',
      description: 'Eastern religions are a major component of comparative world religions study',
    },
  ],
  complexPlanePosition: {
    real: 0.45,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.2025 + 0.3025),
    angle: Math.atan2(0.55, 0.45),
  },
};
