import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const scientificLiteracy: RosettaConcept = {
  id: 'crit-scientific-literacy',
  name: 'Scientific Literacy',
  domain: 'critical-thinking',
  description:
    'Scientific literacy is the capacity to read and interpret scientific claims in the popular press and ' +
    'in primary sources. It includes recognizing the difference between correlation and causation, understanding ' +
    'what a confidence interval means, identifying when a study is too small to draw conclusions, and knowing ' +
    'that a single study is rarely definitive. Scientific literacy bridges critical thinking and science education.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'sci-evaluating-sources',
      description: 'Scientific literacy applies science-domain source evaluation to everyday media consumption',
    },
    {
      type: 'dependency',
      targetId: 'crit-evidence-quality',
      description: 'Assessing scientific claims requires applying evidence quality criteria to empirical studies',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.3025 + 0.36),
    angle: Math.atan2(0.6, 0.55),
  },
};
