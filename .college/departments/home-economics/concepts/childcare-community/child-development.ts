import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const childDevelopment: RosettaConcept = {
  id: 'domestic-child-development',
  name: 'Child Development',
  domain: 'home-economics',
  description:
    'Child development follows predictable sequences across four domains: physical (gross and fine ' +
    'motor milestones), cognitive (Piaget\'s stages: sensorimotor, preoperational, concrete ' +
    'operational, formal operational), language (babbling → single words → two-word combinations → ' +
    'complex sentences, with critical periods), and social-emotional (attachment theory, Erikson\'s ' +
    'psychosocial stages). Age-appropriate activities match developmental stage: infants need ' +
    'sensory stimulation and attachment security; toddlers need parallel play and safe exploration; ' +
    'preschoolers thrive with imaginative play, simple rules, and emerging literacy. Red flags for ' +
    'delayed development include not walking by 18 months, no words by 12 months, or loss of ' +
    'previously acquired skills. Caregivers can support development through responsive interaction ' +
    '(serve-and-return conversations), rich language exposure, unstructured play time, and ' +
    'consistent nurturing routines.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'domestic-childcare-basics',
      description: 'Understanding developmental milestones deepens the practical childcare skills taught in childcare-basics',
    },
  ],
  complexPlanePosition: {
    real: 0.45,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.2025 + 0.3025),
    angle: Math.atan2(0.55, 0.45),
  },
};
