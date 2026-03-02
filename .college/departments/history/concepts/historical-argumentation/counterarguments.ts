import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const counterarguments: RosettaConcept = {
  id: 'hist-counterarguments',
  name: 'Counterarguments & Complexity',
  domain: 'history',
  description:
    'Strong historical arguments acknowledge and address counterevidence and alternative interpretations. ' +
    'A thesis that ignores contrary evidence is weak; one that grapples with complexity and still holds is ' +
    'convincing. Historical complexity means that almost any generalization has exceptions, and acknowledging ' +
    'them actually strengthens rather than undermines an argument. This skill transfers directly to academic ' +
    'writing, debate, and analytical reasoning in any domain.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'hist-evidence-based-writing',
      description: 'Addressing counterarguments requires marshaling evidence for and against competing interpretations',
    },
    {
      type: 'analogy',
      targetId: 'crit-charitable-interpretation',
      description: 'Acknowledging the strongest version of counterarguments is the same skill as charitable interpretation',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.75,
    magnitude: Math.sqrt(0.16 + 0.5625),
    angle: Math.atan2(0.75, 0.4),
  },
};
