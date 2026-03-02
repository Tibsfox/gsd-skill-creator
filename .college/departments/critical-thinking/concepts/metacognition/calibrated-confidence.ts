import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const calibratedConfidence: RosettaConcept = {
  id: 'crit-calibrated-confidence',
  name: 'Calibrated Confidence',
  domain: 'critical-thinking',
  description:
    'Calibrated confidence means expressing uncertainty proportional to the actual evidence. ' +
    'A well-calibrated person who says "I\'m 90% sure" is right about 90% of the time in such statements. ' +
    'Over-confidence leads to poor decisions and surprised by failures; under-confidence leads to paralysis. ' +
    'Calibration can be trained through forecasting practice, receiving feedback on predictions, and ' +
    'explicitly representing probability ranges rather than single-point answers.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'crit-intellectual-humility',
      description: 'Calibration is the quantitative expression of intellectual humility',
    },
    {
      type: 'dependency',
      targetId: 'crit-metacognitive-monitoring',
      description: 'Monitoring one\'s reasoning is a precondition for calibrating one\'s confidence',
    },
  ],
  complexPlanePosition: {
    real: 0.35,
    imaginary: 0.8,
    magnitude: Math.sqrt(0.1225 + 0.64),
    angle: Math.atan2(0.8, 0.35),
  },
};
