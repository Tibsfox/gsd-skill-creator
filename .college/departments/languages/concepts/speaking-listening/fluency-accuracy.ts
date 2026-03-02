import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const fluencyAccuracy: RosettaConcept = {
  id: 'lang-fluency-accuracy',
  name: 'Fluency vs. Accuracy in Speaking',
  domain: 'languages',
  description: 'Fluency and accuracy are the two axes of speaking proficiency -- both matter, but the balance shifts across learning stages. ' +
    'Fluency: smooth, continuous speech with natural pacing, minimal hesitation, appropriate chunking. ' +
    'Accuracy: grammatical correctness, proper pronunciation, appropriate vocabulary selection. ' +
    'The Output Hypothesis (Swain, 1985): producing language (not just comprehending it) forces attention to form in a way input alone does not. ' +
    'Monitor Model (Krashen): the learned system monitors output -- but over-monitoring kills fluency. ' +
    'Task-based language teaching: fluency tasks (no correction, just communicate) vs. accuracy tasks (focus on form). ' +
    'Automaticity: with enough practice, accurate forms become automatic, and fluency increases without sacrificing accuracy. ' +
    'Error correction: immediate correction during fluency practice is harmful; delayed feedback is better for fluency tasks. ' +
    'Plateau problem: learners often fossilize at an intermediate level of accuracy -- continued feedback needed.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'psych-skill-acquisition',
      description: 'Language skill acquisition follows the same stages as other skills -- declarative to procedural to automatic',
    },
    {
      type: 'cross-reference',
      targetId: 'lang-suprasegmentals',
      description: 'Fluency is largely about suprasegmental features -- natural rhythm and intonation signal fluency more than phoneme accuracy',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.36 + 0.3025),
    angle: Math.atan2(0.55, 0.6),
  },
};
