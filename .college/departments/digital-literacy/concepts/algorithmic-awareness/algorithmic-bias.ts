import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const algorithmicBias: RosettaConcept = {
  id: 'diglit-algorithmic-bias',
  name: 'Algorithmic Bias & Fairness',
  domain: 'digital-literacy',
  description: 'From the perspective of a person affected by algorithmic decisions: ' +
    'algorithms make consequential decisions about lending, hiring, healthcare, criminal justice, ' +
    'insurance, and housing. ' +
    'You have rights: GDPR (EU) gives you the right to explanation for automated decisions. ' +
    'Red flags of biased systems: you are consistently denied services others receive, ' +
    'recommendations seem to make wrong assumptions about you, ' +
    'your demographic group has different error rates. ' +
    'What to do: request human review of automated decisions, file complaints with regulatory bodies, ' +
    'support algorithmic accountability legislation. ' +
    'The fairness tension: a system can be accurate overall while being systematically wrong ' +
    'for particular demographic groups -- aggregate accuracy hides group disparities.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'data-algorithmic-bias',
      description: 'Citizens affected by biased systems (diglit view) vs. practitioners who build them (data view) -- both perspectives needed',
    },
    {
      type: 'cross-reference',
      targetId: 'code-computing-ethics',
      description: 'Developer ethics and user digital literacy are two sides of the algorithmic accountability problem',
    },
  ],
  complexPlanePosition: {
    real: 0.35,
    imaginary: 0.75,
    magnitude: Math.sqrt(0.1225 + 0.5625),
    angle: Math.atan2(0.75, 0.35),
  },
};
