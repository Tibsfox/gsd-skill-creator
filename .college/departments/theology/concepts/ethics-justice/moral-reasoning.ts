import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const moralReasoning: RosettaConcept = {
  id: 'theo-moral-reasoning',
  name: 'Moral Reasoning',
  domain: 'theology',
  description:
    'Theological moral reasoning provides frameworks for discerning right action grounded in ' +
    'religious sources and traditions. Divine command theory: actions are right because God commands ' +
    'them (Euthyphro dilemma: is something good because God commands it, or does God command it ' +
    'because it is good?). Natural law theory (Aquinas): human reason can discern God\'s moral ' +
    'order in creation — natural inclinations toward life, reproduction, knowledge, and social ' +
    'living point toward moral duties. Conscience is the proximate norm of morality (Vatican II): ' +
    'one must follow a formed, well-informed conscience. Islamic jurisprudence (fiqh) derives law ' +
    'from Quran, Sunnah, scholarly consensus (ijma), and analogical reasoning (qiyas). Jewish ' +
    'halakha integrates biblical, rabbinic, and responsa literature in ongoing interpretation. ' +
    'Moral formation traditions emphasize virtue cultivation, community accountability, and ' +
    'spiritual practices that shape character over time.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'theo-religious-ethics',
      description: 'Moral reasoning methods apply and extend the ethical frameworks established in religious traditions',
    },
    {
      type: 'analogy',
      targetId: 'theo-social-justice',
      description: 'Both moral reasoning and social justice apply religious ethical principles to practical human situations',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.16 + 0.36),
    angle: Math.atan2(0.6, 0.4),
  },
};
