import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const thesisConstruction: RosettaConcept = {
  id: 'hist-thesis-construction',
  name: 'Historical Thesis Construction',
  domain: 'history',
  description:
    'A historical thesis is a defensible, evidence-based claim that goes beyond summarizing what happened ' +
    'to arguing why it happened, what it means, or how it should be interpreted. ' +
    'A strong thesis is specific, contestable (not obvious), and provable with historical evidence. ' +
    'Constructing good theses is the core skill of historical writing and a key outcome of history education.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'hist-corroboration',
      description: 'A defensible thesis requires corroborated evidence from multiple historical sources',
    },
    {
      type: 'analogy',
      targetId: 'crit-argument-structure',
      description: 'Historical thesis construction applies the general argument-structure pattern to historical claims',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.25 + 0.4225),
    angle: Math.atan2(0.65, 0.5),
  },
};
