import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const crossContamination: RosettaConcept = {
  id: 'cook-cross-contamination',
  name: 'Cross-Contamination Prevention',
  domain: 'culinary-arts',
  description: 'Cross-contamination is the transfer of harmful pathogens from one surface or food ' +
    'to another. Prevention protocols: use separate cutting boards for raw meat and produce (color-' +
    'coded systems help), wash hands with soap for at least 20 seconds after handling raw protein, ' +
    'sanitize all surfaces and utensils that contacted raw meat before using them for other foods, ' +
    'store raw meat on the lowest refrigerator shelf to prevent drips onto ready-to-eat foods. ' +
    'Cross-contamination is the leading cause of foodborne illness in home kitchens. The same ' +
    'principles apply to allergen management -- traces of allergens on shared equipment can trigger ' +
    'severe reactions.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'cook-temperature-danger-zone',
      description: 'Proper temperature control prevents pathogen growth that makes cross-contamination dangerous',
    },
  ],
  complexPlanePosition: {
    real: 0.9,
    imaginary: -0.5,
    magnitude: Math.sqrt(0.81 + 0.25),
    angle: Math.atan2(-0.5, 0.9),
  },
};
