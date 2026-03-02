import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const meditationContemplation: RosettaConcept = {
  id: 'theo-meditation-contemplation',
  name: 'Meditation & Contemplation',
  domain: 'theology',
  description:
    'Contemplative traditions across world religions share practices of stilling ordinary mental ' +
    'activity to cultivate awareness, presence, or union with the divine. Christian contemplative ' +
    'prayer: apophatic (via negativa — releasing concepts and images of God) and kataphatic ' +
    '(lectio divina — sacred reading, meditation, prayer, contemplation). Sufism\'s dhikr ' +
    '(remembrance of God through repetitive divine names) and sama (sacred music listening). ' +
    'Buddhist meditation distinguishes samatha (calm abiding — concentration) from vipassana ' +
    '(insight — observing mental and physical phenomena without attachment). Hindu meditation ' +
    'spans mantra-based japa, pranayama (breath regulation), and raja yoga\'s eight-limbed path. ' +
    'Jewish hitbonenut (contemplative analysis of divine concepts) in Chassidic tradition. ' +
    'Despite theological differences, phenomenological similarities in contemplative experiences ' +
    'across traditions raise questions about universal mystical states vs. culturally conditioned ' +
    'interpretations.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'theo-ritual-practice',
      description: 'Contemplative meditation is a deepening of the interior dimension of ritual practice',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-diaphragmatic-breathing',
      description: 'Breath-based contemplative practices in multiple traditions parallel the diaphragmatic breathing techniques of mind-body education',
    },
  ],
  complexPlanePosition: {
    real: 0.3,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.09 + 0.49),
    angle: Math.atan2(0.7, 0.3),
  },
};
