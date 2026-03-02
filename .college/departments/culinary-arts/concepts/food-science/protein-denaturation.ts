import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const proteinDenaturation: RosettaConcept = {
  id: 'cook-protein-denaturation',
  name: 'Protein Denaturation',
  domain: 'culinary-arts',
  description: 'The unfolding of protein tertiary and quaternary structure by heat, acid, or ' +
    'mechanical action, changing texture and appearance without breaking peptide bonds. Key ' +
    'temperatures: egg whites begin setting at 62-65C (144-149F), yolks at 65-70C (149-158F), ' +
    'meat collagen converts to gelatin at 70C (158F) and above with prolonged cooking. Acid ' +
    'denatures proteins without heat (ceviche, yogurt). Over-denaturation expels moisture ' +
    '(why overcooked chicken is dry). Denaturation is generally irreversible -- you cannot ' +
    'uncook an egg.',
  panels: new Map(),
  relationships: [
    {
      type: 'analogy',
      targetId: 'cook-starch-gelatinization',
      description: 'Both are structural changes triggered by heat -- proteins unfold while starch granules swell and absorb water',
    },
    {
      type: 'cross-reference',
      targetId: 'cook-maillard-reaction',
      description: 'Denatured proteins expose amino acids that participate in Maillard browning reactions',
    },
    {
      type: 'cross-reference',
      targetId: 'cook-temperature-danger-zone',
      description: 'Safe internal temperatures ensure complete protein denaturation for pathogen destruction',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.25 + 0.16),
    angle: Math.atan2(0.4, 0.5),
  },
};
