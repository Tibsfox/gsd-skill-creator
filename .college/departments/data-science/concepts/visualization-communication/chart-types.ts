import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const chartTypes: RosettaConcept = {
  id: 'data-chart-types',
  name: 'Chart Types & When to Use Them',
  domain: 'data-science',
  description: 'Choosing the right chart type for your data and question. ' +
    'Bar chart: comparing categories. Line chart: trends over time. ' +
    'Scatter plot: relationship between two quantitative variables. ' +
    'Histogram: distribution of a single quantitative variable. ' +
    'Box plot: distribution summary with quartiles and outliers. ' +
    'Pie chart: proportions of a whole (use sparingly -- humans read angle poorly). ' +
    'Heat map: two-dimensional relationships with color encoding. ' +
    'The chart type choice makes or breaks the insight: ' +
    'a line chart of categorical data is meaningless; ' +
    'a scatter plot of the relationship between shoe size and salary is perfect. ' +
    'Always choose chart type based on data type and the question you are answering.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'data-data-sources',
      description: 'Chart type depends on whether data is categorical or quantitative, continuous or discrete',
    },
    {
      type: 'cross-reference',
      targetId: 'data-data-storytelling',
      description: 'Chart selection is the first step in data storytelling -- the wrong chart obscures the insight',
    },
  ],
  complexPlanePosition: {
    real: 0.75,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.5625 + 0.09),
    angle: Math.atan2(0.3, 0.75),
  },
};
