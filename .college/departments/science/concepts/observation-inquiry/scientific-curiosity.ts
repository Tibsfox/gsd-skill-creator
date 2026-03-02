import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const scientificCuriosity: RosettaConcept = {
  id: 'sci-scientific-curiosity',
  name: 'Scientific Curiosity & Habits of Mind',
  domain: 'science',
  description:
    'Science is driven by curiosity and shaped by habits of mind: wonder at natural phenomena, skepticism ' +
    'toward unsupported claims, openness to revision when evidence demands it, and intellectual honesty ' +
    'in reporting results even when they contradict expectations. These dispositions are as important as ' +
    'procedural skills and are cultivated through practice, not just instruction.',
  panels: new Map(),
  relationships: [
    {
      type: 'analogy',
      targetId: 'crit-intellectual-humility',
      description: 'Scientific habits of mind parallel the intellectual humility cultivated in critical thinking',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.36 + 0.25),
    angle: Math.atan2(0.5, 0.6),
  },
};
