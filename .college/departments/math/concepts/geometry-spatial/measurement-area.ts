import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const measurementArea: RosettaConcept = {
  id: 'math-measurement-area',
  name: 'Measurement: Area, Perimeter & Volume',
  domain: 'math',
  description:
    'Area measures the two-dimensional space enclosed by a shape; perimeter measures its boundary; ' +
    'volume measures three-dimensional space. Formulas are derived, not memorized -- a rectangle\'s area ' +
    'is understood as counting unit squares, not just length times width. Units matter: area uses square ' +
    'units, volume uses cubic units, and conversions require careful dimensional reasoning.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'math-shape-properties',
      description: 'Area and perimeter formulas are derived from understanding shape properties',
    },
    {
      type: 'cross-reference',
      targetId: 'phys-work-power',
      description: 'Volume and area underpin physics concepts like pressure, force, and work',
    },
  ],
  complexPlanePosition: {
    real: 0.75,
    imaginary: 0.25,
    magnitude: Math.sqrt(0.5625 + 0.0625),
    angle: Math.atan2(0.25, 0.75),
  },
};
