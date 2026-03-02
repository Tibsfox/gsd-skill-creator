import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const ritualPractice: RosettaConcept = {
  id: 'theo-ritual-practice',
  name: 'Ritual Practice',
  domain: 'theology',
  description:
    'Ritual is structured, repeated action that creates meaning, marks transitions, ' +
    'and creates community. Victor Turner\'s liminality framework: rituals move participants ' +
    'through separation (from normal status), liminality (threshold, between states), ' +
    'and aggregation (reincorporation with new status). Rites of passage mark life transitions: ' +
    'birth (baptism, naming ceremonies), adulthood (bar/bat mitzvah, confirmation, quinceañera), ' +
    'marriage (wedding ceremonies), and death (funeral rites). Daily rituals (prayer five times, ' +
    'morning meditation, evening Shabbat) structure time and maintain consciousness of the sacred. ' +
    'Sacred space (church, mosque, temple, shrine, natural sacred sites) concentrates and ' +
    'focuses religious attention. The function of ritual: it works even when the practitioner ' +
    'does not feel devotion -- the structure carries the meaning.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'theo-world-religions',
      description: 'Ritual practices are embedded within and vary by religious tradition',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.36 + 0.16),
    angle: Math.atan2(0.4, 0.6),
  },
};
