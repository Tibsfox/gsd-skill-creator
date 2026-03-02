import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const foodWebs: RosettaConcept = {
  id: 'nature-food-webs',
  name: 'Food Webs',
  domain: 'nature-studies',
  description:
    'Food webs map energy and nutrient flow through ecosystems by connecting who eats whom. ' +
    'Producers (plants, algae, cyanobacteria) capture solar energy through photosynthesis. ' +
    'Primary consumers (herbivores) eat producers. Secondary consumers eat herbivores. Apex ' +
    'predators occupy the top trophic level. Each energy transfer loses approximately 90% as heat ' +
    '(the 10% rule), so pyramids of energy narrow sharply toward the apex. Decomposers (bacteria, ' +
    'fungi, detritivores) recycle nutrients from dead organic matter back to producers. Real food ' +
    'webs are complex networks, not simple chains: most species eat multiple prey and are eaten by ' +
    'multiple predators. Keystone species have disproportionate ecosystem effects (sea otters ' +
    'controlling sea urchin density preserves kelp forests). Trophic cascades occur when changes ' +
    'at one level ripple through the whole web (wolf reintroduction in Yellowstone).',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'nature-ecology',
      description: 'Food webs are a central organizing concept within ecological study of energy flow and species interactions',
    },
    {
      type: 'analogy',
      targetId: 'nature-habitat-types',
      description: 'Different habitat types support distinct food web structures and trophic relationships',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.45,
    magnitude: Math.sqrt(0.3025 + 0.2025),
    angle: Math.atan2(0.45, 0.55),
  },
};
