import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const creationNarratives: RosettaConcept = {
  id: 'theo-creation-narratives',
  name: 'Creation Narratives',
  domain: 'theology',
  description:
    'Creation narratives are foundational religious stories that answer the question "Why is there ' +
    'something rather than nothing?" and establish humanity\'s relationship to the cosmos, the ' +
    'divine, and each other. The Hebrew Genesis presents two distinct creation accounts: Gen 1 ' +
    '(priestly, six-day cosmic creation, humans as image of God/imago dei) and Gen 2 (Yahwist, ' +
    'intimate formation of Adam from earth). Hindu cosmogony varies by tradition: Rigvedic Purusha ' +
    'hymn (cosmic person dismembered to form the world), Puranic cycles of creation and destruction. ' +
    'Enuma Elish (Babylonian): world formed from the body of chaos monster Tiamat. Maori: Te Kore ' +
    '(nothingness) through Te Po (darkness) to emergence of light and form. Scientific cosmology ' +
    '(Big Bang) poses interpretation challenges: concordist, allegorical, and non-overlapping ' +
    'magisteria (NOMA) approaches navigate the relationship between religious and scientific accounts.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'theo-sacred-stories',
      description: 'Creation narratives are paradigmatic sacred stories that establish foundational theological meaning',
    },
    {
      type: 'analogy',
      targetId: 'astro-cosmology',
      description: 'Religious creation narratives and scientific cosmology both address the origin and structure of the universe',
    },
  ],
  complexPlanePosition: {
    real: 0.35,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.1225 + 0.4225),
    angle: Math.atan2(0.65, 0.35),
  },
};
