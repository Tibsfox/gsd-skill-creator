import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const cookingSkills: RosettaConcept = {
  id: 'domestic-cooking-skills',
  name: 'Cooking Skills',
  domain: 'home-economics',
  description:
    'Home cooking skills bridge nutrition knowledge and practical meal production. ' +
    'Kitchen safety foundations: sharp knives are safer than dull ones (more control, less slipping); ' +
    'knife grip uses the "claw" technique with fingers curled back; cutting board stability ' +
    'prevents slipping accidents. Recipe reading: mise en place (everything in its place) ' +
    'prepares all ingredients before cooking begins, preventing forgetting steps under heat pressure. ' +
    'Adapting recipes: 1:1 substitutions (buttermilk = milk + 1 tbsp vinegar per cup); ' +
    'scaling requires adjusting pan size and cooking time proportionally. ' +
    'Weeknight efficiency: batch cooking grains, roasting vegetables on a sheet pan, ' +
    'and having a sauce on hand reduces daily cooking time to 15-20 minutes. ' +
    'Cooking for others requires understanding common dietary restrictions: gluten, ' +
    'dairy, nuts, shellfish -- always ask before serving.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'cook-dry-heat-methods',
      description: 'Culinary-arts provides deep food science for the cooking techniques used in home cooking',
    },
    {
      type: 'dependency',
      targetId: 'domestic-nutrition-planning',
      description: 'Cooking skills must serve nutritional goals -- what to cook matters as much as how',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.25 + 0.09),
    angle: Math.atan2(0.3, 0.5),
  },
};
