import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const revisionStrategies: RosettaConcept = {
  id: 'writ-revision-strategies',
  name: 'Revision Strategies',
  domain: 'writing',
  description: 'Revision means re-seeing, not just fixing typos. ' +
    'Levels of revision: global (structure, argument, character) before local (sentences, words). ' +
    'Common global problems: buried thesis, weak ending, unnecessary opening, ' +
    'underdeveloped section, missing counter-argument, POV inconsistency. ' +
    'Reverse outline: after drafting, outline what you actually wrote (not what you intended) -- ' +
    'reveals structural problems invisble during drafting. ' +
    'Reading aloud: the ear catches awkward sentences that the eye misses. ' +
    'Time away: fresh eyes see what tired eyes cannot. ' +
    'Peer workshop: others see where you are clear and where you are not. ' +
    '"Murder your darlings" (Faulkner): the sentence you love most may be the one that needs cutting.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'writ-peer-feedback',
      description: 'Workshop feedback guides what to revise -- revision is the response to feedback',
    },
    {
      type: 'cross-reference',
      targetId: 'code-iterative-development',
      description: 'Code refactoring and writing revision follow the same logic: make it work, then make it right',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.3025 + 0.3025),
    angle: Math.atan2(0.55, 0.55),
  },
};
