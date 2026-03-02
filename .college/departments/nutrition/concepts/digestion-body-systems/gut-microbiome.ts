import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const gutMicrobiome: RosettaConcept = {
  id: 'nutr-gut-microbiome',
  name: 'The Gut Microbiome',
  domain: 'nutrition',
  description: 'The gut microbiome is the community of ~38 trillion bacteria, fungi, and other microorganisms in the human gastrointestinal tract. ' +
    'Diversity: a healthy microbiome contains hundreds of species. Loss of diversity is associated with numerous diseases. ' +
    'Functions: fiber fermentation → short-chain fatty acids (fuel for colonocytes, anti-inflammatory); vitamin production (K, B12); immune system training; pathogen exclusion. ' +
    'Gut-brain axis: microbiome communicates with the brain via the vagus nerve, immune signals, and neurotransmitter precursors (90% of serotonin produced in gut). ' +
    'Diet shapes the microbiome: fiber diversity feeds microbial diversity. Ultra-processed foods deplete diversity. ' +
    'Dysbiosis: microbial imbalance associated with obesity, type 2 diabetes, inflammatory bowel disease, and possibly mood disorders. ' +
    'Probiotics: live beneficial bacteria in fermented foods (yogurt, kefir, kimchi) and supplements. ' +
    'Prebiotics: dietary fibers that feed beneficial bacteria -- onions, garlic, leeks, oats, asparagus. ' +
    'Fecal microbiota transplant (FMT): transferring stool from healthy donor -- highly effective for recurrent C. difficile infection.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'nutr-digestive-process',
      description: 'The microbiome lives in the large intestine and depends on the digestive process -- fiber reaching the colon is the microbiome\'s primary fuel',
    },
    {
      type: 'cross-reference',
      targetId: 'envr-ecosystem-structure',
      description: 'The gut microbiome is a microbial ecosystem -- ecology concepts (biodiversity, keystone species, trophic interactions) apply at the microscopic scale',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.36 + 0.3025),
    angle: Math.atan2(0.55, 0.6),
  },
};
