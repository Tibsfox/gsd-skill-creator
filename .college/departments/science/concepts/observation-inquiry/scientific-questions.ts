import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const scientificQuestions: RosettaConcept = {
  id: 'sci-scientific-questions',
  name: 'Scientific Questions',
  domain: 'science',
  description:
    'Not all questions are scientific. Scientific questions are testable: they can be answered through ' +
    'observation and experimentation. They typically ask about cause-effect relationships ("What happens ' +
    'to X when Y changes?"). Refining vague curiosities into precise, testable questions is a core ' +
    'scientific skill that precedes all investigation.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'sci-observation-skills',
      description: 'Scientific questions arise from careful observation of phenomena',
    },
    {
      type: 'dependency',
      targetId: 'sci-hypothesis-formation',
      description: 'A testable question is refined into a hypothesis that can be experimentally evaluated',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.64 + 0.04),
    angle: Math.atan2(0.2, 0.8),
  },
};
