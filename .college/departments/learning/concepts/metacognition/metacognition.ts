import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const metacognitionConcept: RosettaConcept = {
  id: 'learn-metacognition',
  name: 'Metacognition',
  domain: 'learning',
  description:
    'Metacognition is the ability to think about your own thinking -- to monitor, ' +
    'evaluate, and regulate your cognitive processes. It has two components: ' +
    'Metacognitive knowledge: beliefs about how learning works, what strategies are effective, ' +
    'and understanding of your own strengths and weaknesses as a learner. ' +
    'Metacognitive regulation: planning (what strategy to use), monitoring (checking comprehension ' +
    'during learning), and evaluating (assessing learning outcomes). ' +
    'Expert learners are highly metacognitive -- they know when they understand and when they don\'t. ' +
    'The Dunning-Kruger effect: novices overestimate their competence because they lack the ' +
    'metacognitive framework to know what they don\'t know; experts underestimate because ' +
    'they are aware of their knowledge\'s limits. ' +
    'The illusion of knowing: reading and re-reading creates familiarity that feels like understanding; ' +
    'retrieval practice breaks this illusion by revealing gaps in actual knowledge. ' +
    'Self-explanation (teaching concepts in your own words) is a metacognitive probe: ' +
    'gaps in explanation reveal gaps in understanding.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'learn-retrieval-practice',
      description: 'Retrieval practice develops metacognitive accuracy by revealing actual vs. perceived knowledge',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.36 + 0.25),
    angle: Math.atan2(0.5, 0.6),
  },
};
