import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const religiousEthics: RosettaConcept = {
  id: 'theo-religious-ethics',
  name: 'Religious Ethics',
  domain: 'theology',
  description:
    'Religious ethical traditions provide frameworks for justice, care, and human dignity ' +
    'grounded in theological conviction. Jewish tikkun olam (repairing the world) grounds ' +
    'social justice action in covenant responsibility. Islamic zakat (almsgiving) and waqf ' +
    '(charitable endowments) create structured redistribution. Christian liberation theology ' +
    '(Gustavo Gutierrez) begins with the preferential option for the poor -- God\'s solidarity ' +
    'with the marginalized grounds justice work. Buddhist social ethics (Sulak Sivaraksa, ' +
    'Engaged Buddhism) applies the Three Jewels to social transformation. ' +
    'Common ground across traditions: care for the poor and vulnerable, hospitality to the stranger, ' +
    'stewardship of the earth, the golden rule (treat others as you wish to be treated -- ' +
    'appears in virtually every tradition). Religious ethics differs from secular ethics in ' +
    'grounding moral obligation in the nature of ultimate reality rather than reason or utility alone.',
  panels: new Map(),
  relationships: [
    {
      type: 'analogy',
      targetId: 'philo-ethics',
      description: 'Religious ethics and philosophical ethics address the same questions from different groundings',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.16 + 0.36),
    angle: Math.atan2(0.6, 0.4),
  },
};
