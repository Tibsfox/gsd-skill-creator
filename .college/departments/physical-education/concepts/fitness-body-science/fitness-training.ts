import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const fitnessTraining: RosettaConcept = {
  id: 'pe-fitness-training',
  name: 'Fitness Training',
  domain: 'physical-education',
  description:
    'Fitness training applies exercise science principles to improve health-related fitness. ' +
    'The FITT principle guides training design: Frequency (how often), Intensity (how hard), ' +
    'Time (how long), Type (which activities). The overload principle states that the body ' +
    'adapts to stress exceeding normal demands -- progressive overload systematically increases ' +
    'stimulus. Specificity: training adaptations are specific to the muscles and energy systems ' +
    'stressed. Reversibility (detraining): gains lost faster than earned when training stops. ' +
    'Recovery is training: muscles grow during rest, not during exercise; sleep, nutrition, ' +
    'and active recovery determine adaptation rate. ' +
    'Heart rate zones guide cardiovascular training: zone 2 (60-70% max HR) builds aerobic base; ' +
    'zones 4-5 develop lactate threshold and VO2 max. ' +
    'Polarized training (80% easy, 20% hard) is evidence-based for endurance athletes.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mb-diaphragmatic-breathing',
      description: 'Diaphragmatic breathing regulates intensity and supports recovery during fitness training',
    },
    {
      type: 'dependency',
      targetId: 'pe-injury-prevention',
      description: 'Safe fitness training requires injury prevention knowledge',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.49 + 0.09),
    angle: Math.atan2(0.3, 0.7),
  },
};
