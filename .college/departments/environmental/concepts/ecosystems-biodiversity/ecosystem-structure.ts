import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const ecosystemStructure: RosettaConcept = {
  id: 'envr-ecosystem-structure',
  name: 'Ecosystem Structure and Function',
  domain: 'environmental',
  description: 'An ecosystem is a community of living organisms interacting with each other and their physical environment. ' +
    'Biotic components: all living organisms -- producers (plants, algae), consumers (herbivores, carnivores), decomposers (bacteria, fungi). ' +
    'Abiotic components: physical environment -- sunlight, water, temperature, soil, atmosphere. ' +
    'Energy flow: unidirectional. Solar energy captured by producers → primary consumers → secondary consumers. Only ~10% of energy transfers between trophic levels. ' +
    'Nutrient cycles: unlike energy, nutrients cycle within ecosystems. Carbon, nitrogen, phosphorus cycles. ' +
    'Carrying capacity: the maximum population a habitat can support given available resources. ' +
    'Ecosystem services: benefits ecosystems provide to humans -- clean water, clean air, pollination, flood control, climate regulation. ' +
    'Keystone species: species with disproportionate ecosystem impact relative to their abundance -- removing them causes cascade effects.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'envr-biodiversity-loss',
      description: 'Biodiversity loss degrades ecosystem function -- species loss disrupts energy flow and nutrient cycling',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.64 + 0.04),
    angle: Math.atan2(0.2, 0.8),
  },
};
