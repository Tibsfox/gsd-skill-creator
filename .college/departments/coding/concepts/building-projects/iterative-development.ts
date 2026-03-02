import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const iterativeDevelopment: RosettaConcept = {
  id: 'code-iterative-development',
  name: 'Iterative Development',
  domain: 'coding',
  description: 'Building software in cycles: plan a small feature, implement it, test it, ' +
    'get feedback, improve. The opposite of waterfall (plan everything, build everything, test at end). ' +
    'Agile methodologies (Scrum, Kanban) formalize iteration into 1-2 week sprints. ' +
    'The core insight: you cannot specify requirements completely upfront because you learn ' +
    'from building. A working prototype reveals gaps that no amount of planning could. ' +
    'MVP (minimum viable product) is the smallest thing you can build that tests your core hypothesis. ' +
    'The release cycle: v0.1 works but is ugly, v0.2 adds features, v1.0 is ready for users.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'code-debugging-strategies',
      description: 'Each iteration produces bugs that must be debugged before the next iteration',
    },
    {
      type: 'cross-reference',
      targetId: 'writ-revision-strategies',
      description: 'Writing revision and code iteration are the same process: make something work, then make it better',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.49 + 0.16),
    angle: Math.atan2(0.4, 0.7),
  },
};
