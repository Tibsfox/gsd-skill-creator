import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const peerFeedback: RosettaConcept = {
  id: 'writ-peer-feedback',
  name: 'Peer Feedback',
  domain: 'writing',
  description: 'Workshop critique is a learnable skill -- both giving and receiving feedback. ' +
    'The workshop method (Iowa model): author stays silent while readers discuss the work as if the author is absent. ' +
    'Good feedback: specific (quote the exact passage), descriptive (say what you see), ' +
    'effect-focused (say what happens for you as a reader, not what should happen). ' +
    'Avoid: prescriptive ("you should"), dismissive ("this doesn\'t work"), vague ("I liked it"). ' +
    'Receiving feedback: listen without defending; take notes; decide later what to use. ' +
    'The reader is always right that they had an experience. ' +
    'They are not always right about the solution. ' +
    'The praise sandwich has been debunked -- be honest and direct with care.',
  panels: new Map(),
  relationships: [
    {
      type: 'analogy',
      targetId: 'code-peer-review',
      description: 'Workshop critique and code review follow identical principles: specific, effect-focused, non-prescriptive',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.45,
    magnitude: Math.sqrt(0.36 + 0.2025),
    angle: Math.atan2(0.45, 0.6),
  },
};
