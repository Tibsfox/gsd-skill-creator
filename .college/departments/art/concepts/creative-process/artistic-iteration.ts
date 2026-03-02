import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const artisticIteration: RosettaConcept = {
  id: 'art-artistic-iteration',
  name: 'Artistic Iteration',
  domain: 'art',
  description:
    'Artistic iteration is the practice of creating, assessing, revising, and improving ' +
    'work over time. Professional artists make dozens of studies, thumbnails, and drafts ' +
    'before a finished work. Picasso\'s bull series (11 lithographs) shows the iterative ' +
    'reduction from realistic representation to essential line. The creative process: ' +
    '(1) Ideation -- generating possibilities through brainstorming and thumbnail sketches; ' +
    '(2) Selection -- choosing the most promising direction; ' +
    '(3) Execution -- realizing the idea with appropriate technique; ' +
    '(4) Assessment -- comparing result to intention; ' +
    '(5) Revision -- addressing gaps between vision and execution. ' +
    'Critique -- receiving specific, actionable feedback from peers -- is central to the ' +
    'revision cycle. The critique framework: describe, interpret, evaluate, theorize.',
  panels: new Map(),
  relationships: [
    {
      type: 'analogy',
      targetId: 'learn-metacognition',
      description: 'Artistic iteration applies metacognitive self-assessment to creative work',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.64 + 0.04),
    angle: Math.atan2(0.2, 0.8),
  },
};
