import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const observationSkills: RosettaConcept = {
  id: 'sci-observation-skills',
  name: 'Observation Skills',
  domain: 'science',
  description:
    'Scientific observation involves deliberate, systematic attention to phenomena using all available senses ' +
    'and instruments. Qualitative observations describe qualities (color, texture, smell); quantitative ' +
    'observations use measurement and numbers. Recording observations accurately and completely is the ' +
    'foundation of all scientific investigation.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'sci-scientific-questions',
      description: 'Careful observation generates the anomalies and curiosities that lead to scientific questions',
    },
  ],
  complexPlanePosition: {
    real: 0.9,
    imaginary: 0.1,
    magnitude: Math.sqrt(0.81 + 0.01),
    angle: Math.atan2(0.1, 0.9),
  },
};
