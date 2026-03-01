import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * The Swan
 *
 * A back extension exercise that strengthens the posterior chain
 * and counters the forward-rounding tendency of desk work.
 */
export const swan: RosettaConcept = {
  id: 'mb-pilates-swan',
  name: 'The Swan',
  domain: 'mind-body',
  description:
    'The Swan is a back extension exercise that strengthens the posterior chain (back extensors, ' +
    'glutes, hamstrings) and counters the forward-rounding tendency of prolonged sitting and ' +
    'desk work. Lie face down, hands under the shoulders (or alongside the chest), legs ' +
    'extended and together. Inhale: press through the hands and lift the chest off the mat, ' +
    'lengthening the spine upward. The lift comes from the upper back, not from pressing the ' +
    'arms straight -- think of elongating rather than crunching backward. Exhale: lower back ' +
    'down with control. ' +
    'The Swan develops upper back strength, opens the chest and shoulders, and builds the ' +
    'extension strength that balances the flexion emphasis of many other Pilates mat exercises. ' +
    'The Swimming variation adds reciprocal arm-leg movement: lift chest, arms, and legs ' +
    'slightly off the mat, then flutter opposite arm and leg up and down. Inhale 5 counts, ' +
    'exhale 5 counts. ' +
    'Beginner modification: keep the hands wider apart for more stability; lift only a small ' +
    'amount; keep the legs on the mat during Swimming. Avoid if acute lower back pain is ' +
    'present. Engage the Powerhouse before lifting to protect the lumbar spine. ' +
    'Developed by Joseph Pilates as part of the classical mat sequence.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mb-pilates-powerhouse',
      description: 'Powerhouse engagement during the Swan protects the lumbar spine by providing anterior stability during spinal extension',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-pilates-rehab-applications',
      description: 'The Swan directly addresses thoracic kyphosis (rounded upper back from desk work) -- a key rehabilitation application',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.49 + 0.09),
    angle: Math.atan2(0.3, 0.7),
  },
};
