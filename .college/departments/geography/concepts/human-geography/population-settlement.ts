import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const populationSettlement: RosettaConcept = {
  id: 'geo-population-settlement',
  name: 'Population & Settlement Patterns',
  domain: 'geography',
  description:
    'Population geography examines where people live and why. Settlement patterns range from dispersed rural ' +
    'to dense urban, shaped by physical geography, resources, trade routes, and historical events. ' +
    'Concepts include population density, urbanization, demographic transition, push-pull migration factors, ' +
    'and mega-cities. Understanding settlement helps explain infrastructure, political power, and resource distribution.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'geo-biomes',
      description: 'Physical geography constrains settlement — most dense populations occupy temperate, arable zones',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.36 + 0.25),
    angle: Math.atan2(0.5, 0.6),
  },
};
