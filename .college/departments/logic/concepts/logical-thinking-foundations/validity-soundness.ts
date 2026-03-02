import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const validitySoundness: RosettaConcept = {
  id: 'log-validity-soundness',
  name: 'Validity and Soundness',
  domain: 'logic',
  description: 'Validity and soundness are the two key standards for evaluating deductive arguments. ' +
    'Valid argument: IF the premises are true, the conclusion MUST be true. Validity is about structure, not content. ' +
    '"All cats are dogs. Fluffy is a cat. Therefore Fluffy is a dog." -- Valid but unsound. ' +
    'Sound argument: valid AND all premises are actually true. Sound arguments guarantee true conclusions. ' +
    'Common confusion: a true conclusion does not make an argument valid. "1+1=2, therefore the sun is hot" -- true conclusion, invalid argument. ' +
    'Deductive vs. inductive: deductive arguments claim certainty (valid/invalid). Inductive arguments claim probability (strong/weak). ' +
    'Modus ponens: "p → q, p, therefore q" -- the most fundamental valid argument form. ' +
    'Modus tollens: "p → q, ¬q, therefore ¬p" -- equally fundamental. ' +
    'These distinctions are essential for evaluating every argument you encounter.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'log-logical-connectives',
      description: 'Validity is assessed using connective truth tables -- you need connectives to evaluate argument forms',
    },
    {
      type: 'cross-reference',
      targetId: 'data-hypothesis-testing',
      description: 'Statistical hypothesis testing is inductive reasoning -- it deals with strength of evidence, not logical validity',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.49 + 0.16),
    angle: Math.atan2(0.4, 0.7),
  },
};
