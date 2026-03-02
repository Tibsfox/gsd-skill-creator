import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const politicalGeography: RosettaConcept = {
  id: 'geo-political-geography',
  name: 'Political Geography & Borders',
  domain: 'geography',
  description:
    'Political geography studies how power is organized and exercised across space. It examines the origins ' +
    'and consequences of national borders (many drawn artificially by colonial powers), geopolitical rivalries, ' +
    'territorial disputes, and the geographic factors that advantage or disadvantage states. ' +
    'Borders shape trade, migration, identity, and conflict — understanding their history reveals why many ' +
    'political tensions exist today.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'geo-culture-regions',
      description: 'Political borders often do (or do not) align with cultural regions, creating stability or tension',
    },
  ],
  complexPlanePosition: {
    real: 0.45,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.2025 + 0.4225),
    angle: Math.atan2(0.65, 0.45),
  },
};
