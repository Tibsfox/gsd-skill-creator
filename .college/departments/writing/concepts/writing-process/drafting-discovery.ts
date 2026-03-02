import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const draftingDiscovery: RosettaConcept = {
  id: 'writ-drafting-discovery',
  name: 'Drafting & Discovery',
  domain: 'writing',
  description: 'Writing is thinking made visible -- you do not always know what you think until you write it. ' +
    'Freewriting: write without stopping or censoring for 10-20 minutes. ' +
    'Do not edit as you go -- the inner critic is the enemy of first drafts. ' +
    'Anne Lamott\'s "shitty first drafts": permission to write badly is essential to writing at all. ' +
    'Zero draft: write before you know what you are saying, to discover what you are saying. ' +
    'The blank page problem: lower the threshold -- write one bad sentence, then another. ' +
    'Discovery drafts are for the writer; later drafts are for the reader. ' +
    'Many writers are revisionists -- their first drafts are purely exploratory; ' +
    'the real writing happens in revision.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'writ-revision-strategies',
      description: 'Drafting produces material that revision shapes -- you cannot revise what you have not written',
    },
    {
      type: 'analogy',
      targetId: 'code-iterative-development',
      description: 'Discovery drafting is like writing a spike solution in coding -- get something working before optimizing',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.49 + 0.09),
    angle: Math.atan2(0.3, 0.7),
  },
};
