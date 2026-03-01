import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const allergenManagement: RosettaConcept = {
  id: 'cook-allergen-management',
  name: 'Allergen Management',
  domain: 'culinary-arts',
  description: 'The Big 9 allergens (US FDA) account for 90% of food allergies: milk, eggs, fish, ' +
    'shellfish, tree nuts, peanuts, wheat, soybeans, and sesame. Label reading is critical: ' +
    '"contains" means the allergen is an ingredient; "may contain" or "processed in a facility" ' +
    'indicates cross-contact risk. Cross-contact prevention requires dedicated equipment, thorough ' +
    'cleaning between uses, and physical separation of allergen-containing ingredients. Common ' +
    'substitutions: oat milk for dairy, flax eggs (1 tbsp ground flax + 3 tbsp water) for chicken ' +
    'eggs, rice flour for wheat flour. Severity awareness: some allergens can cause anaphylaxis ' +
    'at trace amounts -- this is a life-threatening emergency requiring epinephrine.',
  panels: new Map(),
  relationships: [
    {
      type: 'analogy',
      targetId: 'cook-cross-contamination',
      description: 'Same hygiene principles apply to allergen isolation as to pathogen prevention',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: -0.2,
    magnitude: Math.sqrt(0.49 + 0.04),
    angle: Math.atan2(-0.2, 0.7),
  },
};
