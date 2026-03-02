import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const dataRepresentation: RosettaConcept = {
  id: 'math-data-representation',
  name: 'Data Collection & Representation',
  domain: 'math',
  description:
    'Data must be collected systematically and displayed in ways that make patterns visible. ' +
    'Different displays suit different data types: bar graphs for categorical data, histograms ' +
    'for continuous data, scatter plots for bivariate data. Choosing the right display is a ' +
    'judgment call that requires understanding what each representation emphasizes or obscures.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'math-probability-foundations',
      description: 'Data collection connects to probability through experimental versus theoretical probability',
    },
    {
      type: 'analogy',
      targetId: 'stat-data-visualization',
      description: 'Statistical data visualization applies the same principles to more complex datasets',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.64 + 0.04),
    angle: Math.atan2(0.2, 0.8),
  },
};
