import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const digestiveProcess: RosettaConcept = {
  id: 'nutr-digestive-process',
  name: 'The Digestive Process',
  domain: 'nutrition',
  description: 'Digestion converts food into absorbable nutrients through mechanical and chemical processes. ' +
    'Mouth: mechanical breakdown (chewing), salivary amylase begins starch digestion. ' +
    'Stomach: hydrochloric acid (pH 1.5-2) denatures proteins; pepsin begins protein digestion. Churning creates chyme. ' +
    'Small intestine: the main absorption site (~20 feet). Pancreatic enzymes digest all macronutrients. Villi and microvilli dramatically increase surface area. ' +
    'Large intestine: water absorption; gut bacteria ferment undigested fiber; produces short-chain fatty acids (gut fuel). ' +
    'Absorption: nutrients cross intestinal epithelium into portal blood (most nutrients) or lymph (fat-soluble nutrients). ' +
    'Gut motility: regulated by the enteric nervous system ("second brain") -- ~500 million neurons in the gut. ' +
    'Common disruptions: celiac disease (autoimmune; gluten damages villi), IBD, IBS, acid reflux -- disruption at different sites produces different symptoms. ' +
    'Rate of digestion: carbohydrates digest fastest, then proteins, then fats -- explains satiety differences.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'nutr-macronutrients',
      description: 'Digestion operates on macronutrients -- understanding what gets digested requires knowing what the nutrients are',
    },
    {
      type: 'cross-reference',
      targetId: 'psych-mental-health-models',
      description: 'Gut-brain axis: enteric nervous system communicates bidirectionally with the central nervous system -- gut health affects mood and cognition',
    },
    {
      type: 'cross-reference',
      targetId: 'cook-protein-denaturation',
      description: 'Protein denaturation by stomach acid during digestion mirrors the denaturation in cooking -- both processes unfold proteins, one for flavor development, one for nutrient absorption',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.49 + 0.16),
    angle: Math.atan2(0.4, 0.7),
  },
};
