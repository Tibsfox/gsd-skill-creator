import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const carbonCycle: RosettaConcept = {
  id: 'envr-carbon-cycle',
  name: 'The Carbon Cycle',
  domain: 'environmental',
  description: 'The carbon cycle describes how carbon moves through the atmosphere, biosphere, geosphere, and hydrosphere. ' +
    'Carbon reservoirs: atmosphere (CO₂), biosphere (living organisms), soil organic matter, ocean (dissolved CO₂, marine organisms), fossil fuels (geosphere). ' +
    'Photosynthesis: plants absorb CO₂ and water, using sunlight to produce glucose and oxygen -- the primary carbon sink. ' +
    'Respiration: organisms release CO₂ while metabolizing glucose -- returns carbon to atmosphere. ' +
    'Decomposition: dead organic matter is broken down, releasing CO₂ and methane. ' +
    'Fossil fuels: ancient organic matter compressed over millions of years -- burning them releases carbon stored for geological time. ' +
    'Ocean as carbon sink: oceans absorb ~25% of anthropogenic CO₂ -- causing ocean acidification. ' +
    'Anthropogenic disruption: burning fossil fuels and deforestation have increased atmospheric CO₂ from 280 ppm (pre-industrial) to 420+ ppm. ' +
    'Feedback loops: warming thaws permafrost, releasing methane -- a positive feedback amplifying climate change.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'envr-ecosystem-structure',
      description: 'The carbon cycle flows through ecosystems -- producers fix carbon, consumers transfer it, decomposers return it',
    },
    {
      type: 'cross-reference',
      targetId: 'envr-climate-science',
      description: 'Carbon cycle disruption drives climate change -- atmospheric CO₂ concentration is the primary driver of the greenhouse effect',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.4225 + 0.25),
    angle: Math.atan2(0.5, 0.65),
  },
};
