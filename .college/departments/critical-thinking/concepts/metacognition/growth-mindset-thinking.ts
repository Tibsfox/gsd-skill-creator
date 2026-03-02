import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const growthMindsetThinking: RosettaConcept = {
  id: 'crit-growth-mindset-thinking',
  name: 'Growth Mindset in Thinking',
  domain: 'critical-thinking',
  description:
    'Growth mindset, applied to thinking skills, holds that reasoning ability is not fixed — it improves ' +
    'through effort, practice, and feedback. This matters because students who believe logical skill is innate ' +
    'avoid difficult reasoning tasks to protect their self-image. Treating thinking as a skill to develop ' +
    'rather than a talent you either have or don\'t have removes this avoidance and enables deliberate improvement.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'crit-intellectual-humility',
      description: 'Growth mindset and intellectual humility reinforce each other — both require accepting fallibility',
    },
  ],
  complexPlanePosition: {
    real: 0.2,
    imaginary: 0.95,
    magnitude: Math.sqrt(0.04 + 0.9025),
    angle: Math.atan2(0.95, 0.2),
  },
};
