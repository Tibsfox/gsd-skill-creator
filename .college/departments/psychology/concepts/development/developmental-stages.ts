import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const developmentalStages: RosettaConcept = {
  id: 'psych-developmental-stages',
  name: 'Developmental Stages',
  domain: 'psychology',
  description: 'Developmental psychology studies how humans change across the lifespan -- from prenatal through old age. ' +
    'Piaget\'s stages: sensorimotor (0-2), preoperational (2-7), concrete operational (7-11), formal operational (12+). Cognitive development in stages. ' +
    'Object permanence: the understanding (emerging ~8 months) that objects continue to exist when out of sight. ' +
    'Erikson\'s psychosocial stages: 8 stages across the lifespan, each with a developmental crisis to resolve (trust vs. mistrust, identity vs. role confusion). ' +
    'Vygotsky\'s zone of proximal development (ZPD): the gap between what a child can do alone vs. with guidance -- where learning is most effective. ' +
    'Language acquisition: children acquire their native language through exposure and interaction without explicit instruction -- a remarkable feat. ' +
    'Attachment theory: the quality of early caregiver bonds shapes emotional and social development across the lifespan. ' +
    'Adolescent brain development: prefrontal cortex matures through the mid-20s -- explains risk-taking and emotional volatility in adolescence.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'lang-phoneme-inventory',
      description: 'The critical period for phoneme acquisition is a developmental phenomenon -- Piaget and developmental stages explain why L2 phonology is harder after puberty',
    },
    {
      type: 'cross-reference',
      targetId: 'psych-neurons-brain-structure',
      description: 'Developmental stages map onto brain development -- myelination of the prefrontal cortex continues into adulthood, explaining adolescent cognition',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.45,
    magnitude: Math.sqrt(0.4225 + 0.2025),
    angle: Math.atan2(0.45, 0.65),
  },
};
