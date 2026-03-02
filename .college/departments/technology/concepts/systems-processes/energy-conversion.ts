import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const energyConversion: RosettaConcept = {
  id: 'tech-energy-conversion',
  name: 'Energy Conversion & Efficiency',
  domain: 'technology',
  description:
    'Technological systems convert energy from one form to another: chemical → thermal → mechanical → electrical. ' +
    'Efficiency is the ratio of useful output energy to input energy; conversion always loses some energy to heat. ' +
    'Key technologies: internal combustion engines (~25-40% efficient), electric motors (~90-95% efficient), ' +
    'solar cells (~15-25%), and fuel cells (~60%). ' +
    'Energy transitions — from coal to gas to renewables — are driven by improving the efficiency and cost of conversions.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'tech-inputs-processes-outputs',
      description: 'Energy conversion is a specific application of the IPO model where energy is the primary input and output',
    },
    {
      type: 'cross-reference',
      targetId: 'phys-conservation-of-energy',
      description: 'The efficiency ceiling for energy conversion is defined by thermodynamic laws',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.36 + 0.3025),
    angle: Math.atan2(0.55, 0.6),
  },
};
