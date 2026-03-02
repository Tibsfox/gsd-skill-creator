import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const measurementPrecision: RosettaConcept = {
  id: 'tech-measurement-precision',
  name: 'Measurement & Precision',
  domain: 'technology',
  description:
    'Accurate measurement is the foundation of precise fabrication — "measure twice, cut once." ' +
    'Measurement tools range from simple (steel rule, framing square) to precise (caliper ±0.05mm, micrometer ±0.001mm). ' +
    'Accuracy is how close to the true value; precision is how repeatable. ' +
    'Systematic error (calibration offset) and random error (reading variation) must both be managed. ' +
    'The appropriate precision level depends on the application — excessive precision wastes time.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'tech-hand-tools',
      description: 'Measuring tools are hand tools — their proper use requires the same discipline as cutting and fastening tools',
    },
    {
      type: 'cross-reference',
      targetId: 'sci-measurement-units',
      description: 'Scientific measurement principles (accuracy, precision, units) apply directly to technological measurement',
    },
  ],
  complexPlanePosition: {
    real: 0.75,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.5625 + 0.09),
    angle: Math.atan2(0.3, 0.75),
  },
};
