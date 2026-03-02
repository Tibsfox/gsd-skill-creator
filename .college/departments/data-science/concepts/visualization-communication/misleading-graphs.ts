import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const misleadingGraphs: RosettaConcept = {
  id: 'data-misleading-graphs',
  name: 'Misleading Graphs',
  domain: 'data-science',
  description: 'Techniques used (intentionally or not) to make visualizations deceive viewers. ' +
    'Truncated y-axis: starting the axis at a non-zero value to exaggerate small differences. ' +
    '(Fox News famously showed a graph where 35% looked twice as large as 8%.) ' +
    'Dual axes: two different y-axes that can be scaled to imply any relationship. ' +
    'Cherry-picking time ranges: choosing start/end dates to show a trend that reverses before or after. ' +
    'Area chart misuse: making areas proportional to radius instead of area (doubling radius = 4x area). ' +
    'Missing denominator: showing absolute numbers instead of rates (bigger cities have more crime in absolute terms). ' +
    'Always check the y-axis, the scale, the time range, and whether rates or absolutes are shown.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'data-chart-types',
      description: 'Understanding what an honest chart looks like is prerequisite to recognizing misleading ones',
    },
    {
      type: 'cross-reference',
      targetId: 'diglit-misinformation-tactics',
      description: 'Misleading graphs are a specific visual misinformation tactic -- same analytical skills apply',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.25 + 0.36),
    angle: Math.atan2(0.6, 0.5),
  },
};
