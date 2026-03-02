import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const ergonomics: RosettaConcept = {
  id: 'tech-ergonomics',
  name: 'Ergonomics',
  domain: 'technology',
  description:
    'Ergonomics designs products, tools, workplaces, and systems to fit human capabilities and limitations. ' +
    'Physical ergonomics addresses posture, force, repetition, and workspace layout to prevent injury. ' +
    'Cognitive ergonomics addresses information display, task design, and mental workload. ' +
    'Anthropometric data (human body measurements) informs ergonomic design. ' +
    'Ergonomic design improves safety, reduces fatigue, and increases productivity — it benefits users, not just employers.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'tech-product-design',
      description: 'Ergonomics is a core consideration in product design that must be evaluated alongside function and aesthetics',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.4225 + 0.25),
    angle: Math.atan2(0.5, 0.65),
  },
};
