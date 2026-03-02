import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const selfAssessment: RosettaConcept = {
  id: 'learn-self-assessment',
  name: 'Self-Assessment',
  domain: 'learning',
  description:
    'Accurate self-assessment — calibrating confidence to actual knowledge — is a critical ' +
    'metacognitive skill. The Dunning-Kruger effect: novices overestimate competence (they lack ' +
    'the knowledge needed to recognize their gaps); experts underestimate (they\'ve internalized ' +
    'how much there is to know). Calibration improves with feedback: seeing actual test performance ' +
    'vs. predicted performance builds self-knowledge over time. Self-testing (blank page recall, ' +
    'practice problems without answers visible) is the most reliable calibration method — it ' +
    'reveals what you actually know vs. what you recognize. Confidence ratings before answering ' +
    '(1-5 scale) train the habit of prediction before verification. Common calibration errors: ' +
    'fluency illusion (lecture notes feel familiar so you think you understand more deeply than ' +
    'you do); confirmation bias in self-review (stopping review when you see something familiar). ' +
    'Accurate self-assessment drives better study decisions: spending more time on weak areas, ' +
    'less time polishing what\'s already mastered.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'learn-metacognition',
      description: 'Self-assessment is a core application of metacognitive skill to evaluate one\'s own knowledge state',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.25 + 0.25),
    angle: Math.atan2(0.5, 0.5),
  },
};
