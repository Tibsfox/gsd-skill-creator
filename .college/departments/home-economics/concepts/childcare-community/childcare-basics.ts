import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const childcareBasics: RosettaConcept = {
  id: 'domestic-childcare-basics',
  name: 'Childcare Basics',
  domain: 'home-economics',
  description:
    'Childcare competence requires understanding child development, age-appropriate activities, ' +
    'safe supervision, and basic first aid. Developmental stages (Erikson): infancy ' +
    '(trust vs. mistrust), toddler (autonomy vs. shame), preschool (initiative vs. guilt), ' +
    'school age (industry vs. inferiority). Safe play environments: no loose cord hazards, ' +
    'outlet covers, secured furniture, age-appropriate toys (no small parts under 3). ' +
    'Age-appropriate activities: infants need tummy time, sensory exploration, face interaction; ' +
    'toddlers need unstructured play, simple books, movement; school age children need ' +
    'structured and unstructured time, responsibility tasks, peer interaction. ' +
    'Pediatric first aid differs from adult: infant rescue breaths are gentler; ' +
    'choking response for infants is back blows + chest thrusts, not abdominal thrusts. ' +
    'Communicating with children: get to eye level, use simple language, follow the child\'s lead.',
  panels: new Map(),
  relationships: [
    {
      type: 'analogy',
      targetId: 'domestic-home-management',
      description: 'Childcare requires the same systematic planning and routine-building as home management',
    },
  ],
  complexPlanePosition: {
    real: 0.3,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.09 + 0.49),
    angle: Math.atan2(0.7, 0.3),
  },
};
