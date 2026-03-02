import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const measurementUnits: RosettaConcept = {
  id: 'sci-measurement-units',
  name: 'Measurement & SI Units',
  domain: 'science',
  description:
    'Scientific measurement uses the International System of Units (SI) to ensure consistency and ' +
    'reproducibility. Key units include meters (length), kilograms (mass), seconds (time), Kelvin ' +
    '(temperature), and amperes (current). Significant figures communicate measurement precision. ' +
    'Unit analysis (dimensional analysis) is a tool for catching errors and converting between units.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'sci-data-tables-graphs',
      description: 'All data collected must be recorded with appropriate units for tables and graphs to be meaningful',
    },
  ],
  complexPlanePosition: {
    real: 0.85,
    imaginary: 0.15,
    magnitude: Math.sqrt(0.7225 + 0.0225),
    angle: Math.atan2(0.15, 0.85),
  },
};
