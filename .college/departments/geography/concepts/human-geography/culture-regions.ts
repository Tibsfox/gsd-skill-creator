import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const cultureRegions: RosettaConcept = {
  id: 'geo-culture-regions',
  name: 'Culture & Cultural Regions',
  domain: 'geography',
  description:
    'Cultural geography studies how human cultures vary across space. Cultural regions share language, religion, ' +
    'customs, or economic practices. Key processes include cultural diffusion (spread of ideas), acculturation ' +
    '(cultural blending), and globalization (worldwide cultural homogenization). ' +
    'Understanding cultural regions helps explain political alliances, economic trade patterns, and conflict zones.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'geo-population-settlement',
      description: 'Cultural regions often align with settlement patterns — language and religion spread through migration',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.3025 + 0.3025),
    angle: Math.atan2(0.55, 0.55),
  },
};
