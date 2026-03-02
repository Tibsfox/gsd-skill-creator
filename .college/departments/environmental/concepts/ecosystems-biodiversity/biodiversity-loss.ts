import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const biodiversityLoss: RosettaConcept = {
  id: 'envr-biodiversity-loss',
  name: 'Biodiversity and Biodiversity Loss',
  domain: 'environmental',
  description: 'Biodiversity encompasses genetic, species, and ecosystem diversity -- the variety of life on Earth. ' +
    'Current extinction rate: 100-1,000 times the background rate, leading scientists to declare a 6th mass extinction. ' +
    'The HIPPO acronym: Habitat destruction, Invasive species, Pollution, Population growth, Overharvesting -- the main drivers of biodiversity loss. ' +
    'Habitat fragmentation: isolating populations in patches prevents gene flow and makes populations vulnerable to local extinction. ' +
    'Invasive species: non-native species that outcompete, prey on, or displace native species. ' +
    'Keystone species extinction: can trigger trophic cascades -- sea otters → sea urchins → kelp forests. ' +
    'Ecosystem resilience: more diverse ecosystems are more resilient to disturbances -- redundancy provides stability. ' +
    'Conservation approaches: protected areas (30×30 goal), wildlife corridors, species recovery plans, ex-situ conservation (seed banks, zoos).',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'envr-ecosystem-structure',
      description: 'Biodiversity loss is understood through ecosystem structure -- losing species disrupts trophic levels and ecosystem services',
    },
    {
      type: 'cross-reference',
      targetId: 'econ-market-failures',
      description: 'Biodiversity loss is a market failure -- the economic value of ecosystem services is not captured by markets, so they are depleted',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.49 + 0.16),
    angle: Math.atan2(0.4, 0.7),
  },
};
