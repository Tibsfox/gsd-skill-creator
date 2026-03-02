import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const corroboration: RosettaConcept = {
  id: 'hist-corroboration',
  name: 'Corroboration',
  domain: 'history',
  description:
    'Corroboration is the process of comparing multiple sources to check agreement and resolve contradictions. ' +
    'A claim supported by a single source is fragile; a claim corroborated by independent sources is more reliable. ' +
    'When sources disagree, historians ask why: Are the differences significant? Could both be partially correct? ' +
    'Is one source more reliable for this specific question? Corroboration is fundamental to historical thinking.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'hist-source-analysis',
      description: 'Corroboration requires analyzing each source individually before comparing across sources',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.49 + 0.16),
    angle: Math.atan2(0.4, 0.7),
  },
};
