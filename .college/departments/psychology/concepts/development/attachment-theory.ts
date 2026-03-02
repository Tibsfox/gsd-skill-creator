import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const attachmentTheory: RosettaConcept = {
  id: 'psych-attachment-theory',
  name: 'Attachment Theory',
  domain: 'psychology',
  description: 'Attachment theory (Bowlby, Ainsworth) describes how early caregiver bonds shape social and emotional development across the lifespan. ' +
    'Attachment behavioral system: evolved to keep infants close to caregivers for protection -- proximity-seeking under stress. ' +
    'Ainsworth\'s Strange Situation: experimental method revealing secure, anxious-ambivalent, and avoidant attachment styles. ' +
    'Secure attachment: caregiver is reliably responsive -- child explores confidently and is comforted when distressed. ' +
    'Internal working models: mental representations of self and others formed in early attachment -- templates for future relationships. ' +
    'Adult attachment: attachment patterns persist (with variation) into romantic relationships. ' +
    'Disorganized attachment: associated with frightening or abusive caregiving -- linked to dissociation and relationship difficulties. ' +
    'Earned security: insecurely attached individuals can develop earned security through therapeutic relationships and corrective experiences. ' +
    'Neurobiological basis: oxytocin and the caregiving system underlie attachment bonds -- also implicated in social trust broadly.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'psych-developmental-stages',
      description: 'Attachment develops in the first year of life -- it is the earliest and most foundational developmental milestone',
    },
    {
      type: 'cross-reference',
      targetId: 'psych-social-cognition',
      description: 'Attachment internal working models are a form of social cognition -- mental representations of self-other relationships',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.36 + 0.25),
    angle: Math.atan2(0.5, 0.6),
  },
};
