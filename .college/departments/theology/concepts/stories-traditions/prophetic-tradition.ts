import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const propheticTradition: RosettaConcept = {
  id: 'theo-prophetic-tradition',
  name: 'Prophetic Tradition',
  domain: 'theology',
  description:
    'Prophets in the Abrahamic traditions are figures called to deliver divine messages, challenge ' +
    'injustice, and call communities back to covenant fidelity. Hebrew prophets (nevi\'im) range ' +
    'from court prophets to social critics: Amos denounces ritual worship disconnected from justice; ' +
    'Isaiah envisions a suffering servant and universal peace; Jeremiah embodies costly faithfulness ' +
    'in national catastrophe. Islam\'s concept of nubuwwah (prophethood) includes 25 named prophets ' +
    'in the Quran; Muhammad is the "seal of the prophets" — the final revelation. Christian ' +
    'theology interprets the Hebrew prophets as foreshadowing Christ\'s fulfillment. Prophetic ' +
    'characteristics across traditions: divine call (often reluctant), message against social sin ' +
    '(not primarily prediction), and personal suffering for faithfulness. Contemporary "prophetic ' +
    'theology" applies this tradition to speaking against modern injustice — MLK explicitly ' +
    'invoked prophetic calling in the Civil Rights movement.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'theo-sacred-stories',
      description: 'Prophetic narratives are a major genre of sacred stories in Abrahamic traditions',
    },
    {
      type: 'analogy',
      targetId: 'theo-social-justice',
      description: 'The prophetic tradition grounds contemporary faith-based social justice activism in ancient models of speaking truth to power',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.16 + 0.36),
    angle: Math.atan2(0.6, 0.4),
  },
};
