import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const dataStorytelling: RosettaConcept = {
  id: 'data-data-storytelling',
  name: 'Data Storytelling',
  domain: 'data-science',
  description: 'The craft of communicating data insights with narrative structure that compels action. ' +
    'A table of numbers rarely changes minds; a story with data as evidence often does. ' +
    'The narrative arc: context (why this matters), complication (what surprised us), ' +
    'resolution (what we should do). ' +
    'Minto pyramid: start with the conclusion, then the supporting evidence (top-down). ' +
    'Annotation: add text directly to charts explaining the key insight at the data point. ' +
    'Declutter: remove gridlines, borders, redundant legends that do not add information. ' +
    '"Above all else, show the data" (Tufte). ' +
    'Data visualization is a communication act -- the goal is changed understanding, not pretty charts.',
  panels: new Map(),
  relationships: [
    {
      type: 'analogy',
      targetId: 'writ-thematic-analysis',
      description: 'Data storytelling and literary analysis both extract meaning from information and frame it for an audience',
    },
    {
      type: 'cross-reference',
      targetId: 'data-chart-types',
      description: 'Story determines chart type -- a narrative of change over time calls for a line chart',
    },
  ],
  complexPlanePosition: {
    real: 0.45,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.2025 + 0.4225),
    angle: Math.atan2(0.65, 0.45),
  },
};
