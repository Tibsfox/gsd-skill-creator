import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const dataTablesGraphs: RosettaConcept = {
  id: 'sci-data-tables-graphs',
  name: 'Data Tables & Graphs',
  domain: 'science',
  description:
    'Data must be organized and displayed to reveal patterns. Tables organize raw data systematically; ' +
    'graphs (line graphs for continuous change, bar graphs for categories, scatter plots for relationships) ' +
    'make patterns visible. Scientific graphs include labeled axes with units, a descriptive title, and ' +
    'a best-fit line or curve where appropriate.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'sci-measurement-units',
      description: 'Tables and graphs require correctly unitized data from precise measurement',
    },
    {
      type: 'dependency',
      targetId: 'sci-evidence-conclusions',
      description: 'Graphs are the primary tool for identifying patterns that support or refute hypotheses',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.25,
    magnitude: Math.sqrt(0.64 + 0.0625),
    angle: Math.atan2(0.25, 0.8),
  },
};
